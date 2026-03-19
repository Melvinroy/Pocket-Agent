export interface WorkspaceRecord {
  id: string;
  rootPath: string;
  displayName: string;
}

export interface ThreadRecord {
  id: string;
  workspaceId: string;
  title: string;
  status: 'idle' | 'active' | 'archived';
}

export interface EventRecord {
  id: string;
  threadId: string;
  sequence: number;
  kind: string;
  payload: Record<string, unknown>;
}

export interface ApprovalRecord {
  id: string;
  threadId: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface DeviceRecord {
  id: string;
  displayName: string;
  role: 'controller' | 'viewer';
}

export interface ControllerLeaseRecord {
  deviceId: string;
  acquiredAt: string;
}

export interface SessionStore {
  listWorkspaces(): Promise<WorkspaceRecord[]>;
  listThreads(workspaceId: string): Promise<ThreadRecord[]>;
  appendEvent(event: EventRecord): Promise<void>;
}

export function createInMemorySessionStore(): SessionStore {
  const workspaces: WorkspaceRecord[] = [];
  const threads: ThreadRecord[] = [];
  const events: EventRecord[] = [];

  return {
    async listWorkspaces() {
      return workspaces;
    },
    async listThreads(workspaceId) {
      return threads.filter((thread) => thread.workspaceId === workspaceId);
    },
    async appendEvent(event) {
      events.push(event);
    },
  };
}
