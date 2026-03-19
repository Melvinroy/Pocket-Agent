import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

import { createSqliteSessionStore, SqliteSessionStore } from '../src/index.js';

function createTempDbPath(name: string): string {
  return path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'pocket-agent-session-store-')),
    `${name}.sqlite`,
  );
}

describe('session store', () => {
  it('runs migrations and persists workspace plus thread records', async () => {
    const store = createSqliteSessionStore({
      filename: createTempDbPath('records'),
    });

    await store.upsertWorkspace({
      id: 'workspace-1',
      rootPath: '/repo',
      displayName: 'Repo',
      createdAt: '2026-03-19T00:00:00.000Z',
    });
    await store.upsertThread({
      id: 'thread-1',
      workspaceId: 'workspace-1',
      title: 'Bootstrap persistence',
      status: 'active',
      createdAt: '2026-03-19T00:00:00.000Z',
      updatedAt: '2026-03-19T00:01:00.000Z',
    });

    await expect(store.listWorkspaces()).resolves.toEqual([
      {
        id: 'workspace-1',
        rootPath: '/repo',
        displayName: 'Repo',
        createdAt: '2026-03-19T00:00:00.000Z',
      },
    ]);
    await expect(store.getWorkspace('workspace-1')).resolves.toEqual({
      id: 'workspace-1',
      rootPath: '/repo',
      displayName: 'Repo',
      createdAt: '2026-03-19T00:00:00.000Z',
    });
    await expect(store.listThreads('workspace-1')).resolves.toEqual([
      {
        id: 'thread-1',
        workspaceId: 'workspace-1',
        title: 'Bootstrap persistence',
        status: 'active',
        createdAt: '2026-03-19T00:00:00.000Z',
        updatedAt: '2026-03-19T00:01:00.000Z',
      },
    ]);
    await expect(store.getThread('thread-1')).resolves.toEqual({
      id: 'thread-1',
      workspaceId: 'workspace-1',
      title: 'Bootstrap persistence',
      status: 'active',
      createdAt: '2026-03-19T00:00:00.000Z',
      updatedAt: '2026-03-19T00:01:00.000Z',
    });

    await store.dispose();
  });

  it('replays events in sequence order and exposes the latest event', async () => {
    const store = createSqliteSessionStore({
      filename: createTempDbPath('replay'),
    });

    await store.upsertWorkspace({
      id: 'workspace-1',
      rootPath: '/repo',
      displayName: 'Repo',
      createdAt: '2026-03-19T00:00:00.000Z',
    });
    await store.upsertThread({
      id: 'thread-1',
      workspaceId: 'workspace-1',
      title: 'Replay me',
      status: 'active',
      createdAt: '2026-03-19T00:00:00.000Z',
      updatedAt: '2026-03-19T00:02:00.000Z',
    });
    await store.appendEvent({
      id: 'event-2',
      threadId: 'thread-1',
      sequence: 2,
      kind: 'turn.output',
      payload: { line: 'second' },
      createdAt: '2026-03-19T00:00:02.000Z',
    });
    await store.appendEvent({
      id: 'event-1',
      threadId: 'thread-1',
      sequence: 1,
      kind: 'turn.output',
      payload: { line: 'first' },
      createdAt: '2026-03-19T00:00:01.000Z',
    });

    await expect(store.replayThread('thread-1')).resolves.toEqual([
      {
        id: 'event-1',
        threadId: 'thread-1',
        sequence: 1,
        kind: 'turn.output',
        payload: { line: 'first' },
        createdAt: '2026-03-19T00:00:01.000Z',
      },
      {
        id: 'event-2',
        threadId: 'thread-1',
        sequence: 2,
        kind: 'turn.output',
        payload: { line: 'second' },
        createdAt: '2026-03-19T00:00:02.000Z',
      },
    ]);
    await expect(store.getLatestEvent('thread-1')).resolves.toEqual({
      id: 'event-2',
      threadId: 'thread-1',
      sequence: 2,
      kind: 'turn.output',
      payload: { line: 'second' },
      createdAt: '2026-03-19T00:00:02.000Z',
    });

    await store.dispose();
  });

  it('rejects conflicting controller leases while an active one exists', async () => {
    const store = createSqliteSessionStore({
      filename: createTempDbPath('leases'),
    });

    await store.registerDevice({
      id: 'device-1',
      displayName: 'Phone',
      role: 'controller',
      pairedAt: '2026-03-19T00:00:00.000Z',
      revokedAt: null,
    });
    await store.registerDevice({
      id: 'device-2',
      displayName: 'Tablet',
      role: 'controller',
      pairedAt: '2026-03-19T00:00:00.000Z',
      revokedAt: null,
    });

    await expect(
      store.acquireControllerLease({
        id: 'controller',
        deviceId: 'device-1',
        acquiredAt: '2026-03-19T00:00:00.000Z',
        expiresAt: '2026-03-19T00:05:00.000Z',
      }),
    ).resolves.toBe(true);

    await expect(
      store.acquireControllerLease({
        id: 'controller',
        deviceId: 'device-2',
        acquiredAt: '2026-03-19T00:01:00.000Z',
        expiresAt: '2026-03-19T00:06:00.000Z',
      }),
    ).resolves.toBe(false);

    await expect(
      store.getControllerLease('2026-03-19T00:02:00.000Z'),
    ).resolves.toEqual({
      id: 'controller',
      deviceId: 'device-1',
      acquiredAt: '2026-03-19T00:00:00.000Z',
      expiresAt: '2026-03-19T00:05:00.000Z',
    });

    await store.dispose();
  });

  it('stores approvals and audit log entries', async () => {
    const store = createSqliteSessionStore({
      filename: createTempDbPath('audit'),
    });

    await store.upsertWorkspace({
      id: 'workspace-1',
      rootPath: '/repo',
      displayName: 'Repo',
      createdAt: '2026-03-19T00:00:00.000Z',
    });
    await store.upsertThread({
      id: 'thread-1',
      workspaceId: 'workspace-1',
      title: 'Approval flow',
      status: 'idle',
      createdAt: '2026-03-19T00:00:00.000Z',
      updatedAt: '2026-03-19T00:00:00.000Z',
    });
    await store.saveApproval({
      id: 'approval-1',
      threadId: 'thread-1',
      status: 'pending',
      requestedAt: '2026-03-19T00:03:00.000Z',
      resolvedAt: null,
    });
    await store.appendAuditLog({
      id: 'audit-1',
      action: 'approval.requested',
      actorDeviceId: null,
      payload: { approvalId: 'approval-1' },
      createdAt: '2026-03-19T00:03:00.000Z',
    });

    await expect(store.listApprovals('thread-1')).resolves.toEqual([
      {
        id: 'approval-1',
        threadId: 'thread-1',
        status: 'pending',
        requestedAt: '2026-03-19T00:03:00.000Z',
        resolvedAt: null,
      },
    ]);
    await expect(store.getApproval('approval-1')).resolves.toEqual({
      id: 'approval-1',
      threadId: 'thread-1',
      status: 'pending',
      requestedAt: '2026-03-19T00:03:00.000Z',
      resolvedAt: null,
    });
    await expect(store.listAuditLog()).resolves.toEqual([
      {
        id: 'audit-1',
        action: 'approval.requested',
        actorDeviceId: null,
        payload: { approvalId: 'approval-1' },
        createdAt: '2026-03-19T00:03:00.000Z',
      },
    ]);

    await store.dispose();
  });

  it('exposes the concrete sqlite store for host wiring', () => {
    const store = createSqliteSessionStore({
      filename: createTempDbPath('instance'),
    });

    expect(store).toBeInstanceOf(SqliteSessionStore);
  });
});
