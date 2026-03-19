import { randomUUID } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';

import {
  type PairingService,
  redactSecrets,
  type SecurityPolicy,
} from '@codex-remote/security';
import type {
  AuditLogRecord,
  ControllerLeaseRecord,
  DeviceRecord,
  SessionStore,
} from '@codex-remote/session-store';

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

      if (!token) {
        writeJson(response, 401, { error: 'Missing bearer token' });
        return;
      }

      try {
        const authenticated = context.pairingService.authenticate(token);
        context.pairingService.revokeToken(token);
        await appendAudit(
          context.sessionStore,
          'token.revoked',
          authenticated.deviceId,
          {
            role: authenticated.role,
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
      const token = getBearerToken(request);

      if (!token) {
        writeJson(response, 401, { error: 'Missing bearer token' });
        return;
      }

      try {
        const authenticated = context.pairingService.authenticate(token);
        const lease = await context.sessionStore.getControllerLease(
          now().toISOString(),
        );

        writeJson(response, 200, {
          deviceId: authenticated.deviceId,
          role: authenticated.role,
          expiresAt: authenticated.expiresAt,
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
