import { randomUUID } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';

import {
  approvalDecisionSchema,
  createEventEnvelope,
  interruptRequestSchema,
  steerRequestSchema,
} from '@codex-remote/remote-protocol';
import {
  type PairingService,
  redactSecrets,
  type SecurityPolicy,
} from '@codex-remote/security';
import type {
  AuditLogRecord,
  ApprovalRecord,
  ControllerLeaseRecord,
  DeviceRecord,
  EventRecord,
  SessionStore,
  ThreadRecord,
} from '@codex-remote/session-store';
import {
  listWorkspaceEntries,
  readWorkspaceFile,
  writeWorkspaceFile,
} from '@codex-remote/workspace-manager';

import type { HostConfig } from './config.js';

interface PairingStartBody {
  role?: 'controller' | 'viewer';
}

interface PairingConfirmBody {
  pairingId?: string;
  confirmationCode?: string;
  displayName?: string;
}

interface GatewayContext {
  config: HostConfig;
  pairingService: PairingService;
  sessionStore: SessionStore;
  policy: SecurityPolicy;
  now?: () => Date;
}

interface SteerBody {
  instruction?: string;
}

interface InterruptBody {
  reason?: string;
}

interface ApprovalResolveBody {
  decision?: 'approved' | 'rejected';
}

interface FileWriteBody {
  path?: string;
  contents?: string;
}

interface ReviewStartBody {
  path?: string;
  summary?: string;
}

export interface HostGateway {
  server: ReturnType<typeof createServer>;
  start(port?: number): Promise<number>;
  stop(): Promise<void>;
}

async function readJson<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
}

function writeJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
  options: {
    redact?: boolean;
  } = {},
): void {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(
    JSON.stringify(options.redact === false ? payload : redactSecrets(payload)),
  );
}

function getBearerToken(request: IncomingMessage): string | null {
  const header = request.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length);
}

async function authenticateRequest(
  request: IncomingMessage,
  pairingService: PairingService,
): Promise<
  | {
      ok: true;
      authenticated: ReturnType<PairingService['authenticate']>;
    }
  | { ok: false; statusCode: number; error: string }
> {
  const token = getBearerToken(request);

  if (!token) {
    return { ok: false, statusCode: 401, error: 'Missing bearer token' };
  }

  try {
    return { ok: true, authenticated: pairingService.authenticate(token) };
  } catch (error) {
    return {
      ok: false,
      statusCode: 401,
      error: error instanceof Error ? error.message : 'Unable to authenticate',
    };
  }
}

async function requireController(
  request: IncomingMessage,
  context: GatewayContext,
  now: () => Date,
): Promise<
  | {
      ok: true;
      authenticated: ReturnType<PairingService['authenticate']>;
    }
  | { ok: false; statusCode: number; error: string }
> {
  const auth = await authenticateRequest(request, context.pairingService);

  if (!auth.ok) {
    return auth;
  }

  if (auth.authenticated.role !== 'controller') {
    return {
      ok: false,
      statusCode: 403,
      error: 'Controller access is required for this action',
    };
  }

  const lease = await context.sessionStore.getControllerLease(
    now().toISOString(),
  );

  if (!lease || lease.deviceId !== auth.authenticated.deviceId) {
    return {
      ok: false,
      statusCode: 409,
      error: 'This device does not hold the active controller lease',
    };
  }

  return auth;
}

function routeMatch(url: string, pattern: RegExp): RegExpExecArray | null {
  const pathname = url.split('?')[0] ?? url;
  return pattern.exec(pathname);
}

function readQueryValue(url: string, name: string): string | null {
  const search = url.includes('?') ? url.slice(url.indexOf('?')) : '';
  const params = new URLSearchParams(search);
  return params.get(name);
}

async function getNextSequence(
  sessionStore: SessionStore,
  threadId: string,
): Promise<number> {
  const latest = await sessionStore.getLatestEvent(threadId);
  return (latest?.sequence ?? 0) + 1;
}

async function appendThreadEvent(
  sessionStore: SessionStore,
  thread: ThreadRecord,
  event: Omit<EventRecord, 'id' | 'sequence' | 'createdAt'>,
  createdAt: string,
): Promise<EventRecord> {
  const nextEvent: EventRecord = {
    id: randomUUID(),
    threadId: thread.id,
    sequence: await getNextSequence(sessionStore, thread.id),
    kind: event.kind,
    payload: event.payload,
    createdAt,
  };

  await sessionStore.appendEvent(nextEvent);
  await sessionStore.upsertThread({
    ...thread,
    updatedAt: createdAt,
  });

  return nextEvent;
}

async function appendAudit(
  sessionStore: SessionStore,
  action: string,
  actorDeviceId: string | null,
  payload: Record<string, unknown>,
  createdAt: string,
): Promise<void> {
  const entry: AuditLogRecord = {
    id: randomUUID(),
    action,
    actorDeviceId,
    payload,
    createdAt,
  };

  await sessionStore.appendAuditLog(entry);
}

export function createHostGateway(context: GatewayContext): HostGateway {
  const now = context.now ?? (() => new Date());
  const server = createServer(async (request, response) => {
    const { method = 'GET', url = '/' } = request;

    if (method === 'GET' && url === '/api/transport') {
      writeJson(response, 200, {
        transport: 'http',
        websocket: {
          ready: false,
          path: '/api/ws',
        },
      });
      return;
    }

    if (method === 'POST' && url === '/api/pairing/start') {
      const body = await readJson<PairingStartBody>(request);
      const pairing = context.pairingService.createPairingSession(
        body.role ?? 'viewer',
      );

      await appendAudit(
        context.sessionStore,
        'pairing.started',
        null,
        {
          pairingId: pairing.pairingSession.id,
          role: pairing.pairingSession.requestedRole,
        },
        now().toISOString(),
      );

      writeJson(response, 201, pairing);
      return;
    }

    if (method === 'POST' && url === '/api/pairing/confirm') {
      const body = await readJson<PairingConfirmBody>(request);

      if (!body.pairingId || !body.confirmationCode || !body.displayName) {
        writeJson(response, 400, {
          error: 'Missing pairing confirmation fields',
        });
        return;
      }

      try {
        const deviceId = randomUUID();
        const token = context.pairingService.confirmPairing(
          body.pairingId,
          body.confirmationCode,
          deviceId,
        );
        const device: DeviceRecord = {
          id: deviceId,
          displayName: body.displayName,
          role: token.role,
          pairedAt: now().toISOString(),
          revokedAt: null,
        };
        await context.sessionStore.registerDevice(device);

        let controllerLease: ControllerLeaseRecord | null = null;

        if (token.role === 'controller') {
          const lease: ControllerLeaseRecord = {
            id: 'controller',
            deviceId,
            acquiredAt: now().toISOString(),
            expiresAt: token.expiresAt,
          };

          const acquired =
            await context.sessionStore.acquireControllerLease(lease);

          if (!acquired) {
            writeJson(response, 409, {
              error:
                'Another controller device currently holds the active lease',
            });
            return;
          }

          controllerLease = lease;
        }

        await appendAudit(
          context.sessionStore,
          'pairing.confirmed',
          deviceId,
          {
            role: token.role,
          },
          now().toISOString(),
        );

        writeJson(
          response,
          200,
          {
            device,
            accessToken: token.token,
            expiresAt: token.expiresAt,
            controllerLease,
          },
          { redact: false },
        );
      } catch (error) {
        writeJson(response, 400, {
          error:
            error instanceof Error
              ? error.message
              : 'Unable to confirm pairing',
        });
      }
      return;
    }

    if (method === 'POST' && url === '/api/tokens/revoke') {
      const token = getBearerToken(request);
      const auth = await authenticateRequest(request, context.pairingService);

      if (!auth.ok || !token) {
        writeJson(response, auth.ok ? 401 : auth.statusCode, {
          error: auth.ok ? 'Missing bearer token' : auth.error,
        });
        return;
      }

      try {
        context.pairingService.revokeToken(token);
        await appendAudit(
          context.sessionStore,
          'token.revoked',
          auth.authenticated.deviceId,
          {
            role: auth.authenticated.role,
          },
          now().toISOString(),
        );
        writeJson(response, 200, { status: 'revoked' });
      } catch (error) {
        writeJson(response, 401, {
          error:
            error instanceof Error ? error.message : 'Unable to revoke token',
        });
      }
      return;
    }

    if (method === 'GET' && url === '/api/session') {
      const auth = await authenticateRequest(request, context.pairingService);

      if (!auth.ok) {
        writeJson(response, auth.statusCode, { error: auth.error });
        return;
      }

      try {
        const lease = await context.sessionStore.getControllerLease(
          now().toISOString(),
        );

        writeJson(response, 200, {
          deviceId: auth.authenticated.deviceId,
          role: auth.authenticated.role,
          expiresAt: auth.authenticated.expiresAt,
          activeControllerDeviceId: lease?.deviceId ?? null,
          policy: context.policy,
        });
      } catch (error) {
        writeJson(response, 401, {
          error:
            error instanceof Error ? error.message : 'Unable to authenticate',
        });
      }
      return;
    }

    const timelineMatch = routeMatch(
      url,
      /^\/api\/threads\/([^/]+)\/timeline$/,
    );

    if (method === 'GET' && timelineMatch) {
      const auth = await authenticateRequest(request, context.pairingService);

      if (!auth.ok) {
        writeJson(response, auth.statusCode, { error: auth.error });
        return;
      }

      const threadId = timelineMatch[1]!;
      const thread = await context.sessionStore.getThread(threadId);

      if (!thread) {
        writeJson(response, 404, { error: 'Thread not found' });
        return;
      }

      const events = await context.sessionStore.replayThread(threadId);
      const approvals = await context.sessionStore.listApprovals(threadId);

      writeJson(response, 200, {
        thread,
        approvals,
        timeline: events.map((event) => ({
          sequence: event.sequence,
          envelope: createEventEnvelope(
            event.kind as
              | 'turn.status'
              | 'turn.output'
              | 'turn.diff'
              | 'turn.plan'
              | 'approval.requested'
              | 'approval.resolved'
              | 'thread.updated'
              | 'bridge.lifecycle',
            event.payload,
            event.id,
          ),
          createdAt: event.createdAt,
        })),
      });
      return;
    }

    const steerMatch = routeMatch(url, /^\/api\/threads\/([^/]+)\/steer$/);

    if (method === 'POST' && steerMatch) {
      const auth = await requireController(request, context, now);

      if (!auth.ok) {
        writeJson(response, auth.statusCode, { error: auth.error });
        return;
      }

      const body = steerRequestSchema.parse(await readJson<SteerBody>(request));
      const threadId = steerMatch[1]!;
      const thread = await context.sessionStore.getThread(threadId);

      if (!thread) {
        writeJson(response, 404, { error: 'Thread not found' });
        return;
      }

      const createdAt = now().toISOString();
      const event = await appendThreadEvent(
        context.sessionStore,
        thread,
        {
          threadId,
          kind: 'turn.plan',
          payload: {
            instruction: body.instruction,
            actorDeviceId: auth.authenticated.deviceId,
          },
        },
        createdAt,
      );

      await appendAudit(
        context.sessionStore,
        'thread.steer',
        auth.authenticated.deviceId,
        { threadId, instruction: body.instruction },
        createdAt,
      );

      writeJson(response, 202, {
        accepted: true,
        event,
      });
      return;
    }

    const interruptMatch = routeMatch(
      url,
      /^\/api\/threads\/([^/]+)\/interrupt$/,
    );

    if (method === 'POST' && interruptMatch) {
      const auth = await requireController(request, context, now);

      if (!auth.ok) {
        writeJson(response, auth.statusCode, { error: auth.error });
        return;
      }

      const body = interruptRequestSchema.parse(
        await readJson<InterruptBody>(request),
      );
      const threadId = interruptMatch[1]!;
      const thread = await context.sessionStore.getThread(threadId);

      if (!thread) {
        writeJson(response, 404, { error: 'Thread not found' });
        return;
      }

      const createdAt = now().toISOString();
      const event = await appendThreadEvent(
        context.sessionStore,
        thread,
        {
          threadId,
          kind: 'turn.status',
          payload: {
            status: 'interrupted',
            reason: body.reason ?? 'Controller requested interrupt',
            actorDeviceId: auth.authenticated.deviceId,
          },
        },
        createdAt,
      );

      await appendAudit(
        context.sessionStore,
        'thread.interrupt',
        auth.authenticated.deviceId,
        { threadId, reason: body.reason ?? null },
        createdAt,
      );

      writeJson(response, 202, {
        accepted: true,
        event,
      });
      return;
    }

    const approvalMatch = routeMatch(
      url,
      /^\/api\/approvals\/([^/]+)\/resolve$/,
    );

    if (method === 'POST' && approvalMatch) {
      const auth = await requireController(request, context, now);

      if (!auth.ok) {
        writeJson(response, auth.statusCode, { error: auth.error });
        return;
      }

      const body = await readJson<ApprovalResolveBody>(request);
      const parsedDecision = approvalDecisionSchema.safeParse(body.decision);

      if (!parsedDecision.success) {
        writeJson(response, 400, { error: 'Invalid approval decision' });
        return;
      }

      const approvalId = approvalMatch[1]!;
      const approval = await context.sessionStore.getApproval(approvalId);

      if (!approval) {
        writeJson(response, 404, { error: 'Approval not found' });
        return;
      }

      const thread = await context.sessionStore.getThread(approval.threadId);

      if (!thread) {
        writeJson(response, 404, { error: 'Thread not found' });
        return;
      }

      const resolvedAt = now().toISOString();
      const updatedApproval: ApprovalRecord = {
        ...approval,
        status: parsedDecision.data,
        resolvedAt,
      };

      await context.sessionStore.saveApproval(updatedApproval);
      const event = await appendThreadEvent(
        context.sessionStore,
        thread,
        {
          threadId: thread.id,
          kind: 'approval.resolved',
          payload: {
            approvalId,
            decision: parsedDecision.data,
            actorDeviceId: auth.authenticated.deviceId,
          },
        },
        resolvedAt,
      );

      await appendAudit(
        context.sessionStore,
        'approval.resolved',
        auth.authenticated.deviceId,
        {
          approvalId,
          threadId: thread.id,
          decision: parsedDecision.data,
        },
        resolvedAt,
      );

      writeJson(response, 200, {
        approval: updatedApproval,
        event,
      });
      return;
    }

    const filesMatch = routeMatch(url, /^\/api\/workspaces\/([^/]+)\/files$/);

    if (method === 'GET' && filesMatch) {
      const auth = await authenticateRequest(request, context.pairingService);

      if (!auth.ok) {
        writeJson(response, auth.statusCode, { error: auth.error });
        return;
      }

      const workspace = await context.sessionStore.getWorkspace(filesMatch[1]!);

      if (!workspace) {
        writeJson(response, 404, { error: 'Workspace not found' });
        return;
      }

      const entries = await listWorkspaceEntries(
        {
          workspaceId: workspace.id,
          rootPath: workspace.rootPath,
          activeWorktreePath: workspace.rootPath,
        },
        readQueryValue(url, 'path') ?? '.',
      );

      writeJson(response, 200, {
        workspaceId: workspace.id,
        entries,
      });
      return;
    }

    const fileMatch = routeMatch(url, /^\/api\/workspaces\/([^/]+)\/file$/);

    if (method === 'GET' && fileMatch) {
      const auth = await authenticateRequest(request, context.pairingService);

      if (!auth.ok) {
        writeJson(response, auth.statusCode, { error: auth.error });
        return;
      }

      const relativePath = readQueryValue(url, 'path');
      if (!relativePath) {
        writeJson(response, 400, { error: 'Missing file path' });
        return;
      }

      const workspace = await context.sessionStore.getWorkspace(fileMatch[1]!);

      if (!workspace) {
        writeJson(response, 404, { error: 'Workspace not found' });
        return;
      }

      const contents = await readWorkspaceFile(
        {
          workspaceId: workspace.id,
          rootPath: workspace.rootPath,
          activeWorktreePath: workspace.rootPath,
        },
        relativePath,
      );

      writeJson(response, 200, {
        workspaceId: workspace.id,
        path: relativePath,
        contents,
      });
      return;
    }

    if (method === 'POST' && fileMatch) {
      const auth = await requireController(request, context, now);

      if (!auth.ok) {
        writeJson(response, auth.statusCode, { error: auth.error });
        return;
      }

      const body = await readJson<FileWriteBody>(request);
      if (!body.path || typeof body.contents !== 'string') {
        writeJson(response, 400, { error: 'Missing file write payload' });
        return;
      }

      const workspace = await context.sessionStore.getWorkspace(fileMatch[1]!);

      if (!workspace) {
        writeJson(response, 404, { error: 'Workspace not found' });
        return;
      }

      await writeWorkspaceFile(
        {
          workspaceId: workspace.id,
          rootPath: workspace.rootPath,
          activeWorktreePath: workspace.rootPath,
        },
        body.path,
        body.contents,
      );

      await appendAudit(
        context.sessionStore,
        'file.write',
        auth.authenticated.deviceId,
        {
          workspaceId: workspace.id,
          path: body.path,
        },
        now().toISOString(),
      );

      writeJson(response, 200, {
        workspaceId: workspace.id,
        path: body.path,
        status: 'saved',
      });
      return;
    }

    const reviewMatch = routeMatch(url, /^\/api\/threads\/([^/]+)\/review$/);

    if (method === 'POST' && reviewMatch) {
      const auth = await requireController(request, context, now);

      if (!auth.ok) {
        writeJson(response, auth.statusCode, { error: auth.error });
        return;
      }

      const body = await readJson<ReviewStartBody>(request);
      const thread = await context.sessionStore.getThread(reviewMatch[1]!);

      if (!thread) {
        writeJson(response, 404, { error: 'Thread not found' });
        return;
      }

      const createdAt = now().toISOString();
      const event = await appendThreadEvent(
        context.sessionStore,
        thread,
        {
          threadId: thread.id,
          kind: 'thread.updated',
          payload: {
            reviewStarted: true,
            path: body.path ?? null,
            summary: body.summary ?? 'Review started from the remote shell',
            actorDeviceId: auth.authenticated.deviceId,
          },
        },
        createdAt,
      );

      await appendAudit(
        context.sessionStore,
        'review.started',
        auth.authenticated.deviceId,
        {
          threadId: thread.id,
          path: body.path ?? null,
        },
        createdAt,
      );

      writeJson(response, 202, {
        accepted: true,
        event,
      });
      return;
    }

    writeJson(response, 404, { error: `Unknown route: ${method} ${url}` });
  });

  return {
    server,
    async start(port = context.config.port) {
      await new Promise<void>((resolve) => {
        server.listen(port, context.config.bindAddress, () => resolve());
      });

      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Unable to resolve gateway address');
      }

      return address.port;
    },
    async stop() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
  };
}
