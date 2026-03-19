import {
  type ApprovalSummary,
  type FileChangeSummary,
  getThreadApprovals,
  getThreadFiles,
  getThreadPresets,
  getThreadTimeline,
  getWorkspace,
  getWorkspaceFiles,
  getWorkspaceThreads,
  getWorkspaceWorktrees,
  shellState,
  type TerminalPresetSummary,
  type ThreadSummary,
  threads,
  type TimelineEntry,
  type WorktreeSummary,
  type WorkspaceSummary,
  workspaces,
} from './mock-data';

export interface ShellStateView {
  deviceName: string;
  role: string;
  connection: string;
  reconnectLabel: string;
}

export interface TransportConfig {
  enabled: boolean;
  websocketUrl: string | null;
  accessToken: string | null;
}

interface SessionPayload {
  deviceId: string;
  role: string;
  activeControllerDeviceId: string | null;
}

interface WorkspacePayload {
  id: string;
  displayName: string;
  rootPath: string;
  threadCount: number;
  activeThreadId: string | null;
  activeControllerDeviceId: string | null;
}

interface ThreadPayload {
  id: string;
  workspaceId: string;
  title: string;
  status: 'idle' | 'streaming' | 'review';
  updatedAt: string;
  turnCount: number;
  latestEventSummary: string;
  latestEventName: string | null;
  pendingApprovals: number;
}

interface TimelinePayload {
  approvals: Array<{
    id: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
  timeline: Array<{
    sequence: number;
    createdAt: string;
    envelope: {
      id: string;
      name: string;
      payload: Record<string, unknown>;
    };
  }>;
}

interface FileListPayload {
  entries: Array<{
    name: string;
    path: string;
    kind: 'file' | 'directory';
  }>;
}

interface WorktreeListPayload {
  worktrees: Array<{
    path: string;
    name: string;
    active: boolean;
  }>;
}

function hostBaseUrl(): string | null {
  const baseUrl = process.env.POCKET_AGENT_HOST_URL?.trim();
  return baseUrl ? baseUrl.replace(/\/$/, '') : null;
}

function accessToken(): string | null {
  return process.env.POCKET_AGENT_ACCESS_TOKEN?.trim() || null;
}

function websocketUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/api/ws';
  url.search = '';
  return url.toString();
}

async function fetchHostJson<T>(path: string): Promise<T | null> {
  const baseUrl = hostBaseUrl();
  const token = accessToken();

  if (!baseUrl || !token) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function mapShellState(session: SessionPayload | null): ShellStateView {
  if (!session) {
    return shellState;
  }

  return {
    deviceName: session.deviceId,
    role: session.role,
    connection: 'live',
    reconnectLabel: session.activeControllerDeviceId
      ? 'websocket ready'
      : 'viewer waiting',
  };
}

function mapWorkspace(workspace: WorkspacePayload): WorkspaceSummary {
  return {
    id: workspace.id,
    name: workspace.displayName,
    repo: workspace.rootPath,
    branch: 'host workspace',
    status: workspace.activeThreadId ? 'active' : 'paired',
    threads: workspace.threadCount,
    controller: workspace.activeControllerDeviceId ?? 'No active controller',
    presence: workspace.activeControllerDeviceId
      ? '1 controller connected'
      : 'view-only',
  };
}

function mapThread(thread: ThreadPayload): ThreadSummary {
  return {
    id: thread.id,
    workspaceId: thread.workspaceId,
    title: thread.title,
    status: thread.status,
    summary: thread.latestEventSummary,
    updatedAt: thread.updatedAt,
    turnCount: thread.turnCount,
    planState: thread.latestEventName ?? 'live transport',
  };
}

function summarizePayload(payload: Record<string, unknown>): string {
  if (typeof payload.summary === 'string' && payload.summary) {
    return payload.summary;
  }

  if (typeof payload.chunk === 'string' && payload.chunk) {
    return payload.chunk;
  }

  if (typeof payload.instruction === 'string' && payload.instruction) {
    return payload.instruction;
  }

  if (typeof payload.reason === 'string' && payload.reason) {
    return payload.reason;
  }

  if (typeof payload.status === 'string' && payload.status) {
    return `Status: ${payload.status}`;
  }

  if (typeof payload.worktreePath === 'string') {
    return `Bound worktree ${payload.worktreePath}`;
  }

  if (typeof payload.preset === 'string') {
    return `Ran preset ${payload.preset}`;
  }

  return 'Host event';
}

function mapTimelineEntry(
  entry: TimelinePayload['timeline'][number],
): TimelineEntry {
  return {
    id: entry.envelope.id,
    threadId: String(entry.envelope.payload.threadId ?? ''),
    title: entry.envelope.name,
    status: entry.envelope.name,
    summary: summarizePayload(entry.envelope.payload),
    meta: entry.createdAt,
  };
}

function mapApproval(
  threadId: string,
  approval: TimelinePayload['approvals'][number],
): ApprovalSummary {
  return {
    id: approval.id,
    threadId,
    title: `Approval ${approval.id}`,
    status: approval.status,
    summary: `Host approval is ${approval.status}.`,
  };
}

function mapWorkspaceEntry(
  workspaceId: string,
  threadId: string,
  entry: FileListPayload['entries'][number],
): FileChangeSummary {
  return {
    id: `${workspaceId}:${entry.path}`,
    workspaceId,
    threadId,
    path: entry.path,
    status: entry.kind === 'file' ? 'modified' : 'new',
    summary: `Workspace ${entry.kind}`,
  };
}

function mapWorktree(
  workspaceId: string,
  worktree: WorktreeListPayload['worktrees'][number],
): WorktreeSummary {
  return {
    id: `${workspaceId}:${worktree.path}`,
    workspaceId,
    name: worktree.name,
    path: worktree.path,
    active: worktree.active,
  };
}

function buildTransportConfig(): TransportConfig {
  const baseUrl = hostBaseUrl();
  const token = accessToken();

  if (!baseUrl || !token) {
    return {
      enabled: false,
      websocketUrl: null,
      accessToken: null,
    };
  }

  return {
    enabled: true,
    websocketUrl: websocketUrl(baseUrl),
    accessToken: token,
  };
}

export async function getHomeView() {
  const session = await fetchHostJson<SessionPayload>('/api/session');
  const workspacePayload = await fetchHostJson<{
    workspaces: WorkspacePayload[];
  }>('/api/workspaces');

  if (!workspacePayload) {
    return {
      shell: shellState,
      workspaces,
      featuredThread: threads[0] ?? null,
      transport: buildTransportConfig(),
    };
  }

  const mappedWorkspaces = workspacePayload.workspaces.map(mapWorkspace);
  const featuredWorkspaceId = workspacePayload.workspaces[0]?.id;
  const threadPayload = featuredWorkspaceId
    ? await fetchHostJson<{ threads: ThreadPayload[] }>(
        `/api/workspaces/${featuredWorkspaceId}/threads`,
      )
    : null;

  return {
    shell: mapShellState(session),
    workspaces: mappedWorkspaces,
    featuredThread: threadPayload?.threads[0]
      ? mapThread(threadPayload.threads[0])
      : null,
    transport: buildTransportConfig(),
  };
}

export async function getWorkspaceView(workspaceId: string) {
  const session = await fetchHostJson<SessionPayload>('/api/session');
  const workspacePayload = await fetchHostJson<{ workspace: WorkspacePayload }>(
    `/api/workspaces/${workspaceId}`,
  );

  if (!workspacePayload) {
    return {
      shell: shellState,
      workspace: getWorkspace(workspaceId) ?? null,
      threads: getWorkspaceThreads(workspaceId),
      files: getWorkspaceFiles(workspaceId),
      worktrees: getWorkspaceWorktrees(workspaceId),
    };
  }

  const [threadPayload, filePayload, worktreePayload] = await Promise.all([
    fetchHostJson<{ threads: ThreadPayload[] }>(
      `/api/workspaces/${workspaceId}/threads`,
    ),
    fetchHostJson<FileListPayload>(`/api/workspaces/${workspaceId}/files`),
    fetchHostJson<WorktreeListPayload>(
      `/api/workspaces/${workspaceId}/worktrees`,
    ),
  ]);

  const primaryThreadId =
    threadPayload?.threads[0]?.id ??
    getWorkspaceThreads(workspaceId)[0]?.id ??
    '';

  return {
    shell: mapShellState(session),
    workspace: mapWorkspace(workspacePayload.workspace),
    threads:
      threadPayload?.threads.map(mapThread) ?? getWorkspaceThreads(workspaceId),
    files:
      filePayload?.entries.map((entry) =>
        mapWorkspaceEntry(workspaceId, primaryThreadId, entry),
      ) ?? getWorkspaceFiles(workspaceId),
    worktrees:
      worktreePayload?.worktrees.map((worktree) =>
        mapWorktree(workspaceId, worktree),
      ) ?? getWorkspaceWorktrees(workspaceId),
  };
}

export async function getThreadView(workspaceId: string, threadId: string) {
  const session = await fetchHostJson<SessionPayload>('/api/session');
  const [workspacePayload, threadPayload, timelinePayload, filePayload] =
    await Promise.all([
      fetchHostJson<{ workspace: WorkspacePayload }>(
        `/api/workspaces/${workspaceId}`,
      ),
      fetchHostJson<{ thread: ThreadPayload }>(`/api/threads/${threadId}`),
      fetchHostJson<TimelinePayload>(`/api/threads/${threadId}/timeline`),
      fetchHostJson<FileListPayload>(`/api/workspaces/${workspaceId}/files`),
    ]);

  if (!workspacePayload || !threadPayload || !timelinePayload) {
    return {
      shell: shellState,
      workspace: getWorkspace(workspaceId) ?? null,
      thread: threads.find((thread) => thread.id === threadId) ?? null,
      timeline: getThreadTimeline(threadId),
      approvals: getThreadApprovals(threadId),
      files: getThreadFiles(threadId),
      presets: getThreadPresets(threadId),
      transport: buildTransportConfig(),
    };
  }

  const presets: TerminalPresetSummary[] = (
    ['lint', 'test', 'build'] as const
  ).map((preset) => ({
    id: `${threadId}:${preset}`,
    threadId,
    preset,
    cwd: 'bound workspace',
    status: timelinePayload.timeline.some(
      (entry) => entry.envelope.payload.preset === preset,
    )
      ? 'last-run'
      : 'ready',
  }));

  return {
    shell: mapShellState(session),
    workspace: mapWorkspace(workspacePayload.workspace),
    thread: mapThread(threadPayload.thread),
    timeline: timelinePayload.timeline.map(mapTimelineEntry),
    approvals: timelinePayload.approvals.map((approval) =>
      mapApproval(threadId, approval),
    ),
    files:
      filePayload?.entries.map((entry) =>
        mapWorkspaceEntry(workspaceId, threadId, entry),
      ) ?? getThreadFiles(threadId),
    presets,
    transport: buildTransportConfig(),
  };
}
