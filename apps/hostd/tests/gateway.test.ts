import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  PairingService,
  DEFAULT_SECURITY_POLICY,
} from '@pocket-agent/security';
import {
  createInMemorySessionStore,
  type SessionStore,
} from '@pocket-agent/session-store';

import { createHostGateway } from '../src/lib/gateway.js';

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (cleanups.length > 0) {
    await cleanups.pop()?.();
  }
});

const fixedNow = () => new Date('2026-03-19T00:00:00.000Z');

async function createControllerSession(port: number) {
  const startResponse = await fetch(
    `http://127.0.0.1:${port}/api/pairing/start`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role: 'controller' }),
    },
  );
  const started = (await startResponse.json()) as {
    pairingSession: { id: string; confirmationCode: string };
  };
  const confirmResponse = await fetch(
    `http://127.0.0.1:${port}/api/pairing/confirm`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        pairingId: started.pairingSession.id,
        confirmationCode: started.pairingSession.confirmationCode,
        displayName: 'Primary Phone',
      }),
    },
  );

  return (await confirmResponse.json()) as {
    accessToken: string;
    device: { id: string };
  };
}

async function seedThreadState(sessionStore: SessionStore) {
  const rootPath = fs.mkdtempSync(
    path.join(os.tmpdir(), 'pocket-agent-gateway-'),
  );
  fs.writeFileSync(path.join(rootPath, 'README.md'), '# Pocket Agent\n');
  fs.mkdirSync(path.join(rootPath, 'src'), { recursive: true });
  fs.mkdirSync(path.join(rootPath, '.worktrees', 'feature-ui'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(rootPath, '.worktrees', 'feature-ui', 'README.md'),
    '# Feature UI\n',
  );
  fs.writeFileSync(
    path.join(rootPath, 'src', 'app.ts'),
    'export const app = 1;\n',
  );

  await sessionStore.upsertWorkspace({
    id: 'workspace-1',
    rootPath,
    displayName: 'Pocket Agent',
    createdAt: fixedNow().toISOString(),
  });
  await sessionStore.upsertThread({
    id: 'thread-1',
    workspaceId: 'workspace-1',
    title: 'Timeline approvals',
    status: 'active',
    createdAt: fixedNow().toISOString(),
    updatedAt: fixedNow().toISOString(),
  });
  await sessionStore.appendEvent({
    id: 'event-1',
    threadId: 'thread-1',
    sequence: 1,
    kind: 'turn.output',
    payload: { chunk: 'host booted' },
    createdAt: fixedNow().toISOString(),
  });
  await sessionStore.saveApproval({
    id: 'approval-1',
    threadId: 'thread-1',
    status: 'pending',
    requestedAt: fixedNow().toISOString(),
    resolvedAt: null,
  });

  return rootPath;
}

describe('host gateway', () => {
  it('creates a pairing session and confirms a viewer device', async () => {
    const gateway = createHostGateway({
      config: {
        bindAddress: '127.0.0.1',
        port: 0,
        logLevel: 'info',
        allowedOrigin: null,
      },
      now: fixedNow,
      pairingService: new PairingService({
        now: fixedNow,
      }),
      sessionStore: createInMemorySessionStore(),
      policy: DEFAULT_SECURITY_POLICY,
    });
    cleanups.push(() => gateway.stop());
    const port = await gateway.start(0);

    const startResponse = await fetch(
      `http://127.0.0.1:${port}/api/pairing/start`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          role: 'viewer',
        }),
      },
    );
    const started = (await startResponse.json()) as {
      pairingSession: { id: string; confirmationCode: string };
    };

    const confirmResponse = await fetch(
      `http://127.0.0.1:${port}/api/pairing/confirm`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          pairingId: started.pairingSession.id,
          confirmationCode: started.pairingSession.confirmationCode,
          displayName: 'Phone',
        }),
      },
    );
    const confirmed = (await confirmResponse.json()) as {
      device: { role: string; id: string };
      accessToken: string;
    };

    expect(confirmResponse.status).toBe(200);
    expect(confirmed.device.role).toBe('viewer');
    expect(confirmed.accessToken).toBeTruthy();
  });

  it('enforces a single active controller lease and supports revoke flow', async () => {
    const gateway = createHostGateway({
      config: {
        bindAddress: '127.0.0.1',
        port: 0,
        logLevel: 'info',
        allowedOrigin: null,
      },
      now: fixedNow,
      pairingService: new PairingService({
        now: fixedNow,
      }),
      sessionStore: createInMemorySessionStore(),
      policy: DEFAULT_SECURITY_POLICY,
    });
    cleanups.push(() => gateway.stop());
    const port = await gateway.start(0);

    const startPairing = async () => {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/pairing/start`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'controller' }),
        },
      );

      return (await response.json()) as {
        pairingSession: { id: string; confirmationCode: string };
      };
    };

    const first = await startPairing();
    const firstConfirm = await fetch(
      `http://127.0.0.1:${port}/api/pairing/confirm`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pairingId: first.pairingSession.id,
          confirmationCode: first.pairingSession.confirmationCode,
          displayName: 'Primary Phone',
        }),
      },
    );
    const firstPayload = (await firstConfirm.json()) as { accessToken: string };

    const second = await startPairing();
    const secondConfirm = await fetch(
      `http://127.0.0.1:${port}/api/pairing/confirm`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pairingId: second.pairingSession.id,
          confirmationCode: second.pairingSession.confirmationCode,
          displayName: 'Secondary Phone',
        }),
      },
    );

    expect(secondConfirm.status).toBe(409);

    const sessionResponse = await fetch(
      `http://127.0.0.1:${port}/api/session`,
      {
        headers: {
          authorization: `Bearer ${firstPayload.accessToken}`,
        },
      },
    );
    const session = (await sessionResponse.json()) as {
      role: string;
      activeControllerDeviceId: string | null;
    };

    expect(session.role).toBe('controller');
    expect(session.activeControllerDeviceId).toBeTruthy();

    const revokeResponse = await fetch(
      `http://127.0.0.1:${port}/api/tokens/revoke`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${firstPayload.accessToken}`,
        },
      },
    );

    expect(revokeResponse.status).toBe(200);
  });

  it('streams timeline state and restricts steer plus approval actions to the controller', async () => {
    const sessionStore = createInMemorySessionStore();
    const rootPath = await seedThreadState(sessionStore);

    const gateway = createHostGateway({
      config: {
        bindAddress: '127.0.0.1',
        port: 0,
        logLevel: 'info',
        allowedOrigin: null,
      },
      now: fixedNow,
      pairingService: new PairingService({
        now: fixedNow,
      }),
      commandRunner: async ({ cwd }) => ({
        exitCode: 0,
        stdout: `preset ran in ${cwd}`,
        stderr: '',
      }),
      sessionStore,
      policy: DEFAULT_SECURITY_POLICY,
    });
    cleanups.push(() => gateway.stop());
    const port = await gateway.start(0);

    const controller = await createControllerSession(port);

    const viewerStart = await fetch(
      `http://127.0.0.1:${port}/api/pairing/start`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: 'viewer' }),
      },
    );
    const viewerPairing = (await viewerStart.json()) as {
      pairingSession: { id: string; confirmationCode: string };
    };
    const viewerConfirm = await fetch(
      `http://127.0.0.1:${port}/api/pairing/confirm`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pairingId: viewerPairing.pairingSession.id,
          confirmationCode: viewerPairing.pairingSession.confirmationCode,
          displayName: 'Viewer Phone',
        }),
      },
    );
    const viewer = (await viewerConfirm.json()) as { accessToken: string };

    const timelineResponse = await fetch(
      `http://127.0.0.1:${port}/api/threads/thread-1/timeline`,
      {
        headers: {
          authorization: `Bearer ${controller.accessToken}`,
        },
      },
    );
    const timelinePayload = (await timelineResponse.json()) as {
      approvals: Array<{ id: string; status: string }>;
      timeline: Array<{
        sequence: number;
        envelope: { name: string; payload: Record<string, unknown> };
      }>;
    };

    expect(timelineResponse.status).toBe(200);
    expect(timelinePayload.timeline[0]?.envelope.name).toBe('turn.output');
    expect(timelinePayload.approvals[0]?.status).toBe('pending');

    const viewerSteer = await fetch(
      `http://127.0.0.1:${port}/api/threads/thread-1/steer`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${viewer.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ instruction: 'Continue phase 5' }),
      },
    );

    expect(viewerSteer.status).toBe(403);

    const controllerSteer = await fetch(
      `http://127.0.0.1:${port}/api/threads/thread-1/steer`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${controller.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ instruction: 'Continue phase 5' }),
      },
    );
    const steerPayload = (await controllerSteer.json()) as {
      event: { kind: string; payload: { instruction: string } };
    };

    expect(controllerSteer.status).toBe(202);
    expect(steerPayload.event.kind).toBe('turn.plan');
    expect(steerPayload.event.payload.instruction).toBe('Continue phase 5');

    const resolveResponse = await fetch(
      `http://127.0.0.1:${port}/api/approvals/approval-1/resolve`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${controller.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ decision: 'approved' }),
      },
    );
    const resolvePayload = (await resolveResponse.json()) as {
      approval: { status: string };
      event: { kind: string };
    };

    expect(resolveResponse.status).toBe(200);
    expect(resolvePayload.approval.status).toBe('approved');
    expect(resolvePayload.event.kind).toBe('approval.resolved');

    const interruptResponse = await fetch(
      `http://127.0.0.1:${port}/api/threads/thread-1/interrupt`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${controller.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Need approval context' }),
      },
    );
    const interruptPayload = (await interruptResponse.json()) as {
      event: { kind: string; payload: { status: string } };
    };

    expect(interruptResponse.status).toBe(202);
    expect(interruptPayload.event.kind).toBe('turn.status');
    expect(interruptPayload.event.payload.status).toBe('interrupted');

    const filesResponse = await fetch(
      `http://127.0.0.1:${port}/api/workspaces/workspace-1/files`,
      {
        headers: {
          authorization: `Bearer ${controller.accessToken}`,
        },
      },
    );
    const filesPayload = (await filesResponse.json()) as {
      entries: Array<{ name: string; kind: string }>;
    };

    expect(filesResponse.status).toBe(200);
    expect(filesPayload.entries.map((entry) => entry.name)).toContain('src');

    const worktreesResponse = await fetch(
      `http://127.0.0.1:${port}/api/workspaces/workspace-1/worktrees`,
      {
        headers: {
          authorization: `Bearer ${controller.accessToken}`,
        },
      },
    );
    const worktreesPayload = (await worktreesResponse.json()) as {
      worktrees: Array<{ name: string; active: boolean }>;
    };

    expect(worktreesResponse.status).toBe(200);
    expect(worktreesPayload.worktrees.map((worktree) => worktree.name)).toEqual(
      ['root', 'feature-ui'],
    );

    const bindResponse = await fetch(
      `http://127.0.0.1:${port}/api/threads/thread-1/worktree`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${controller.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          path: '.worktrees/feature-ui',
        }),
      },
    );
    const bindPayload = (await bindResponse.json()) as {
      worktreePath: string;
    };

    expect(bindResponse.status).toBe(200);
    expect(bindPayload.worktreePath).toContain('.worktrees');

    const readResponse = await fetch(
      `http://127.0.0.1:${port}/api/workspaces/workspace-1/file?path=README.md`,
      {
        headers: {
          authorization: `Bearer ${controller.accessToken}`,
        },
      },
    );
    const readPayload = (await readResponse.json()) as { contents: string };

    expect(readResponse.status).toBe(200);
    expect(readPayload.contents).toContain('Pocket Agent');

    const writeResponse = await fetch(
      `http://127.0.0.1:${port}/api/workspaces/workspace-1/file`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${controller.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          path: 'notes/review.md',
          contents: 'Review checklist',
        }),
      },
    );

    expect(writeResponse.status).toBe(200);
    expect(
      fs.readFileSync(path.join(rootPath, 'notes', 'review.md'), 'utf8'),
    ).toContain('Review checklist');

    const reviewResponse = await fetch(
      `http://127.0.0.1:${port}/api/threads/thread-1/review`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${controller.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          path: 'src/app.ts',
          summary: 'Inspect changed file from diff',
        }),
      },
    );
    const reviewPayload = (await reviewResponse.json()) as {
      event: { kind: string; payload: { reviewStarted: boolean } };
    };

    expect(reviewResponse.status).toBe(202);
    expect(reviewPayload.event.kind).toBe('thread.updated');
    expect(reviewPayload.event.payload.reviewStarted).toBe(true);

    const presetResponse = await fetch(
      `http://127.0.0.1:${port}/api/threads/thread-1/commands/preset`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${controller.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          preset: 'test',
        }),
      },
    );
    const presetPayload = (await presetResponse.json()) as {
      cwd: string;
      result: { exitCode: number; stdout: string };
      event: { kind: string };
    };

    expect(presetResponse.status).toBe(200);
    expect(presetPayload.cwd).toContain('.worktrees');
    expect(presetPayload.result.exitCode).toBe(0);
    expect(presetPayload.result.stdout).toContain('preset ran');
    expect(presetPayload.event.kind).toBe('turn.output');
  });
});
