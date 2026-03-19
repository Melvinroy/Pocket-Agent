import { DatabaseSync } from 'node:sqlite';

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export interface WorkspaceRecord {
  id: string;
  rootPath: string;
  displayName: string;
  createdAt: string;
}

export interface ThreadRecord {
  id: string;
  workspaceId: string;
  title: string;
  status: 'idle' | 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface EventRecord {
  id: string;
  threadId: string;
  sequence: number;
  kind: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface ApprovalRecord {
  id: string;
  threadId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  resolvedAt: string | null;
}

export interface DeviceRecord {
  id: string;
  displayName: string;
  role: 'controller' | 'viewer';
  pairedAt: string;
  revokedAt: string | null;
}

export interface ControllerLeaseRecord {
  id: 'controller';
  deviceId: string;
  acquiredAt: string;
  expiresAt: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  actorDeviceId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export const workspacesTable = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  rootPath: text('root_path').notNull(),
  displayName: text('display_name').notNull(),
  createdAt: text('created_at').notNull(),
});

export const threadsTable = sqliteTable('threads', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  title: text('title').notNull(),
  status: text('status', {
    enum: ['idle', 'active', 'archived'],
  }).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const eventsTable = sqliteTable('events', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull(),
  sequence: integer('sequence').notNull(),
  kind: text('kind').notNull(),
  payloadJson: text('payload_json').notNull(),
  createdAt: text('created_at').notNull(),
});

export const approvalsTable = sqliteTable('approvals', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull(),
  status: text('status', {
    enum: ['pending', 'approved', 'rejected'],
  }).notNull(),
  requestedAt: text('requested_at').notNull(),
  resolvedAt: text('resolved_at'),
});

export const devicesTable = sqliteTable('devices', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  role: text('role', {
    enum: ['controller', 'viewer'],
  }).notNull(),
  pairedAt: text('paired_at').notNull(),
  revokedAt: text('revoked_at'),
});

export const controllerLeasesTable = sqliteTable('controller_leases', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull(),
  acquiredAt: text('acquired_at').notNull(),
  expiresAt: text('expires_at').notNull(),
});

export const auditLogTable = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  action: text('action').notNull(),
  actorDeviceId: text('actor_device_id'),
  payloadJson: text('payload_json').notNull(),
  createdAt: text('created_at').notNull(),
});

export const schema = {
  workspacesTable,
  threadsTable,
  eventsTable,
  approvalsTable,
  devicesTable,
  controllerLeasesTable,
  auditLogTable,
};

const migrationStatements = [
  `
    CREATE TABLE IF NOT EXISTS _pocket_agent_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      root_path TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES threads(id),
      sequence INTEGER NOT NULL,
      kind TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `,
  `
    CREATE UNIQUE INDEX IF NOT EXISTS events_thread_sequence_idx
    ON events(thread_id, sequence);
  `,
  `
    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES threads(id),
      status TEXT NOT NULL,
      requested_at TEXT NOT NULL,
      resolved_at TEXT
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL,
      paired_at TEXT NOT NULL,
      revoked_at TEXT
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS controller_leases (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL REFERENCES devices(id),
      acquired_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      actor_device_id TEXT REFERENCES devices(id),
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `,
];

export interface SessionStore {
  listWorkspaces(): Promise<WorkspaceRecord[]>;
  upsertWorkspace(workspace: WorkspaceRecord): Promise<void>;
  listThreads(workspaceId: string): Promise<ThreadRecord[]>;
  getThread(threadId: string): Promise<ThreadRecord | null>;
  upsertThread(thread: ThreadRecord): Promise<void>;
  appendEvent(event: EventRecord): Promise<void>;
  replayThread(threadId: string): Promise<EventRecord[]>;
  getLatestEvent(threadId: string): Promise<EventRecord | null>;
  saveApproval(approval: ApprovalRecord): Promise<void>;
  getApproval(approvalId: string): Promise<ApprovalRecord | null>;
  listApprovals(threadId: string): Promise<ApprovalRecord[]>;
  registerDevice(device: DeviceRecord): Promise<void>;
  acquireControllerLease(lease: ControllerLeaseRecord): Promise<boolean>;
  getControllerLease(now: string): Promise<ControllerLeaseRecord | null>;
  appendAuditLog(entry: AuditLogRecord): Promise<void>;
  listAuditLog(): Promise<AuditLogRecord[]>;
  dispose(): Promise<void>;
}

export function createInMemorySessionStore(): SessionStore {
  const workspaces = new Map<string, WorkspaceRecord>();
  const threads = new Map<string, ThreadRecord>();
  const events = new Map<string, EventRecord[]>();
  const approvals = new Map<string, ApprovalRecord[]>();
  const devices = new Map<string, DeviceRecord>();
  let controllerLease: ControllerLeaseRecord | null = null;
  const auditLog: AuditLogRecord[] = [];

  return {
    async listWorkspaces() {
      return [...workspaces.values()];
    },
    async upsertWorkspace(workspace) {
      workspaces.set(workspace.id, workspace);
    },
    async listThreads(workspaceId) {
      return [...threads.values()].filter(
        (thread) => thread.workspaceId === workspaceId,
      );
    },
    async getThread(threadId) {
      return threads.get(threadId) ?? null;
    },
    async upsertThread(thread) {
      threads.set(thread.id, thread);
    },
    async appendEvent(event) {
      const existing = events.get(event.threadId) ?? [];
      existing.push(event);
      existing.sort((left, right) => left.sequence - right.sequence);
      events.set(event.threadId, existing);
    },
    async replayThread(threadId) {
      return events.get(threadId) ?? [];
    },
    async getLatestEvent(threadId) {
      return (events.get(threadId) ?? []).at(-1) ?? null;
    },
    async saveApproval(approval) {
      const existing = approvals.get(approval.threadId) ?? [];
      approvals.set(approval.threadId, [
        ...existing.filter((entry) => entry.id !== approval.id),
        approval,
      ]);
    },
    async getApproval(approvalId) {
      for (const threadApprovals of approvals.values()) {
        const approval = threadApprovals.find(
          (entry) => entry.id === approvalId,
        );

        if (approval) {
          return approval;
        }
      }

      return null;
    },
    async listApprovals(threadId) {
      return approvals.get(threadId) ?? [];
    },
    async registerDevice(device) {
      devices.set(device.id, device);
    },
    async acquireControllerLease(lease) {
      if (
        controllerLease &&
        controllerLease.deviceId !== lease.deviceId &&
        controllerLease.expiresAt > lease.acquiredAt
      ) {
        return false;
      }

      controllerLease = lease;
      return true;
    },
    async getControllerLease(now) {
      if (!controllerLease || controllerLease.expiresAt <= now) {
        return null;
      }

      return controllerLease;
    },
    async appendAuditLog(entry) {
      auditLog.push(entry);
    },
    async listAuditLog() {
      return auditLog;
    },
    async dispose() {
      return undefined;
    },
  };
}

export interface SqliteSessionStoreOptions {
  filename?: string;
}

export function runMigrations(connection: DatabaseSync): void {
  connection.exec('PRAGMA foreign_keys = ON;');
  connection.exec(migrationStatements[0]!);

  const appliedRows = connection
    .prepare('SELECT id FROM _pocket_agent_migrations')
    .all() as Array<{ id: string }>;
  const applied = new Set(appliedRows.map((row) => row.id));

  migrationStatements.slice(1).forEach((statement, index) => {
    const migrationId = `000${index + 1}`;

    if (!applied.has(migrationId)) {
      connection.exec(statement);
      connection
        .prepare(
          'INSERT INTO _pocket_agent_migrations (id, applied_at) VALUES (?, ?)',
        )
        .run(migrationId, new Date().toISOString());
    }
  });
}

function parseJsonPayload<T>(payloadJson: string): T {
  return JSON.parse(payloadJson) as T;
}

export class SqliteSessionStore implements SessionStore {
  private readonly connection: DatabaseSync;

  public constructor(options: SqliteSessionStoreOptions = {}) {
    this.connection = new DatabaseSync(options.filename ?? ':memory:');
    runMigrations(this.connection);
  }

  public async listWorkspaces(): Promise<WorkspaceRecord[]> {
    return this.connection
      .prepare(
        'SELECT id, root_path AS rootPath, display_name AS displayName, created_at AS createdAt FROM workspaces ORDER BY created_at ASC',
      )
      .all() as unknown as WorkspaceRecord[];
  }

  public async upsertWorkspace(workspace: WorkspaceRecord): Promise<void> {
    this.connection
      .prepare(
        `
          INSERT INTO workspaces (id, root_path, display_name, created_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            root_path = excluded.root_path,
            display_name = excluded.display_name,
            created_at = excluded.created_at
        `,
      )
      .run(
        workspace.id,
        workspace.rootPath,
        workspace.displayName,
        workspace.createdAt,
      );
  }

  public async listThreads(workspaceId: string): Promise<ThreadRecord[]> {
    return this.connection
      .prepare(
        `
          SELECT
            id,
            workspace_id AS workspaceId,
            title,
            status,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM threads
          WHERE workspace_id = ?
          ORDER BY updated_at DESC
        `,
      )
      .all(workspaceId) as unknown as ThreadRecord[];
  }

  public async getThread(threadId: string): Promise<ThreadRecord | null> {
    const row = this.connection
      .prepare(
        `
          SELECT
            id,
            workspace_id AS workspaceId,
            title,
            status,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM threads
          WHERE id = ?
          LIMIT 1
        `,
      )
      .get(threadId) as ThreadRecord | undefined;

    return row ?? null;
  }

  public async upsertThread(thread: ThreadRecord): Promise<void> {
    this.connection
      .prepare(
        `
          INSERT INTO threads (id, workspace_id, title, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            workspace_id = excluded.workspace_id,
            title = excluded.title,
            status = excluded.status,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at
        `,
      )
      .run(
        thread.id,
        thread.workspaceId,
        thread.title,
        thread.status,
        thread.createdAt,
        thread.updatedAt,
      );
  }

  public async appendEvent(event: EventRecord): Promise<void> {
    this.connection
      .prepare(
        `
          INSERT INTO events (id, thread_id, sequence, kind, payload_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        event.id,
        event.threadId,
        event.sequence,
        event.kind,
        JSON.stringify(event.payload),
        event.createdAt,
      );
  }

  public async replayThread(threadId: string): Promise<EventRecord[]> {
    const rows = this.connection
      .prepare(
        `
          SELECT
            id,
            thread_id AS threadId,
            sequence,
            kind,
            payload_json AS payloadJson,
            created_at AS createdAt
          FROM events
          WHERE thread_id = ?
          ORDER BY sequence ASC
        `,
      )
      .all(threadId) as Array<{
      id: string;
      threadId: string;
      sequence: number;
      kind: string;
      payloadJson: string;
      createdAt: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      threadId: row.threadId,
      sequence: row.sequence,
      kind: row.kind,
      payload: parseJsonPayload<Record<string, unknown>>(row.payloadJson),
      createdAt: row.createdAt,
    }));
  }

  public async getLatestEvent(threadId: string): Promise<EventRecord | null> {
    const row = this.connection
      .prepare(
        `
          SELECT
            id,
            thread_id AS threadId,
            sequence,
            kind,
            payload_json AS payloadJson,
            created_at AS createdAt
          FROM events
          WHERE thread_id = ?
          ORDER BY sequence DESC
          LIMIT 1
        `,
      )
      .get(threadId) as
      | {
          id: string;
          threadId: string;
          sequence: number;
          kind: string;
          payloadJson: string;
          createdAt: string;
        }
      | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      threadId: row.threadId,
      sequence: row.sequence,
      kind: row.kind,
      payload: parseJsonPayload<Record<string, unknown>>(row.payloadJson),
      createdAt: row.createdAt,
    };
  }

  public async saveApproval(approval: ApprovalRecord): Promise<void> {
    this.connection
      .prepare(
        `
          INSERT INTO approvals (id, thread_id, status, requested_at, resolved_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            thread_id = excluded.thread_id,
            status = excluded.status,
            requested_at = excluded.requested_at,
            resolved_at = excluded.resolved_at
        `,
      )
      .run(
        approval.id,
        approval.threadId,
        approval.status,
        approval.requestedAt,
        approval.resolvedAt,
      );
  }

  public async listApprovals(threadId: string): Promise<ApprovalRecord[]> {
    return this.connection
      .prepare(
        `
          SELECT
            id,
            thread_id AS threadId,
            status,
            requested_at AS requestedAt,
            resolved_at AS resolvedAt
          FROM approvals
          WHERE thread_id = ?
          ORDER BY requested_at ASC
        `,
      )
      .all(threadId) as unknown as ApprovalRecord[];
  }

  public async getApproval(approvalId: string): Promise<ApprovalRecord | null> {
    const row = this.connection
      .prepare(
        `
          SELECT
            id,
            thread_id AS threadId,
            status,
            requested_at AS requestedAt,
            resolved_at AS resolvedAt
          FROM approvals
          WHERE id = ?
          LIMIT 1
        `,
      )
      .get(approvalId) as ApprovalRecord | undefined;

    return row ?? null;
  }

  public async registerDevice(device: DeviceRecord): Promise<void> {
    this.connection
      .prepare(
        `
          INSERT INTO devices (id, display_name, role, paired_at, revoked_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            display_name = excluded.display_name,
            role = excluded.role,
            paired_at = excluded.paired_at,
            revoked_at = excluded.revoked_at
        `,
      )
      .run(
        device.id,
        device.displayName,
        device.role,
        device.pairedAt,
        device.revokedAt,
      );
  }

  public async acquireControllerLease(
    lease: ControllerLeaseRecord,
  ): Promise<boolean> {
    this.connection.exec('BEGIN IMMEDIATE');

    try {
      const current = this.connection
        .prepare(
          `
            SELECT
              id,
              device_id AS deviceId,
              acquired_at AS acquiredAt,
              expires_at AS expiresAt
            FROM controller_leases
            WHERE id = 'controller' AND expires_at > ?
          `,
        )
        .get(lease.acquiredAt) as ControllerLeaseRecord | undefined;

      if (current && current.deviceId !== lease.deviceId) {
        this.connection.exec('ROLLBACK');
        return false;
      }

      this.connection
        .prepare(
          `
            INSERT INTO controller_leases (id, device_id, acquired_at, expires_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              device_id = excluded.device_id,
              acquired_at = excluded.acquired_at,
              expires_at = excluded.expires_at
          `,
        )
        .run(lease.id, lease.deviceId, lease.acquiredAt, lease.expiresAt);

      this.connection.exec('COMMIT');
      return true;
    } catch (error) {
      this.connection.exec('ROLLBACK');
      throw error;
    }
  }

  public async getControllerLease(
    now: string,
  ): Promise<ControllerLeaseRecord | null> {
    const row = this.connection
      .prepare(
        `
          SELECT
            id,
            device_id AS deviceId,
            acquired_at AS acquiredAt,
            expires_at AS expiresAt
          FROM controller_leases
          WHERE id = 'controller' AND expires_at > ?
        `,
      )
      .get(now) as ControllerLeaseRecord | undefined;

    return row ?? null;
  }

  public async appendAuditLog(entry: AuditLogRecord): Promise<void> {
    this.connection
      .prepare(
        `
          INSERT INTO audit_log (id, action, actor_device_id, payload_json, created_at)
          VALUES (?, ?, ?, ?, ?)
        `,
      )
      .run(
        entry.id,
        entry.action,
        entry.actorDeviceId,
        JSON.stringify(entry.payload),
        entry.createdAt,
      );
  }

  public async listAuditLog(): Promise<AuditLogRecord[]> {
    const rows = this.connection
      .prepare(
        `
          SELECT
            id,
            action,
            actor_device_id AS actorDeviceId,
            payload_json AS payloadJson,
            created_at AS createdAt
          FROM audit_log
          ORDER BY created_at ASC
        `,
      )
      .all() as Array<{
      id: string;
      action: string;
      actorDeviceId: string | null;
      payloadJson: string;
      createdAt: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      actorDeviceId: row.actorDeviceId,
      payload: parseJsonPayload<Record<string, unknown>>(row.payloadJson),
      createdAt: row.createdAt,
    }));
  }

  public async dispose(): Promise<void> {
    this.connection.close();
  }
}

export function createSqliteSessionStore(
  options: SqliteSessionStoreOptions = {},
): SessionStore {
  return new SqliteSessionStore(options);
}
