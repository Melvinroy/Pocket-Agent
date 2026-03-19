export type WorkspaceSummary = {
  id: string;
  name: string;
  repo: string;
  branch: string;
  status: 'active' | 'paired' | 'reconnecting';
  threads: number;
  controller: string;
  presence: string;
  warning?: string;
};

export type ThreadSummary = {
  id: string;
  workspaceId: string;
  title: string;
  status: 'streaming' | 'review' | 'idle';
  summary: string;
  updatedAt: string;
  turnCount: number;
  planState: string;
};

export type TimelineEntry = {
  id: string;
  threadId: string;
  title: string;
  status: string;
  summary: string;
  meta?: string;
};

export const shellState = {
  deviceName: 'Melvin iPhone',
  role: 'controller',
  connection: 'steady',
  reconnectLabel: '27ms heartbeat',
};

export const workspaces: WorkspaceSummary[] = [
  {
    id: 'pocket-agent',
    name: 'Pocket Agent',
    repo: 'Melvinroy/Pocket-Agent',
    branch: 'codex/feat/mobile-shell',
    status: 'active',
    threads: 4,
    controller: 'Melvin iPhone',
    presence: '1 controller, 2 viewers',
  },
  {
    id: 'bridge-lab',
    name: 'Bridge Lab',
    repo: 'Melvinroy/Codex-Bridge-Fixtures',
    branch: 'main',
    status: 'paired',
    threads: 2,
    controller: 'Desktop',
    presence: 'desktop only',
  },
  {
    id: 'release-hardening',
    name: 'Release Hardening',
    repo: 'Melvinroy/Pocket-Agent',
    branch: 'codex/chore/oss-hardening',
    status: 'reconnecting',
    threads: 1,
    controller: 'No active controller',
    presence: 'viewer waiting',
    warning: 'Host resumed after restart. Timeline replay is catching up.',
  },
];

export const threads: ThreadSummary[] = [
  {
    id: 'thread-mobile-shell',
    workspaceId: 'pocket-agent',
    title: 'Mobile shell polish',
    status: 'streaming',
    summary:
      'Thread detail now exposes composer, presence, reconnect state, and route-level context for the active workspace.',
    updatedAt: '2 min ago',
    turnCount: 19,
    planState: 'Shipping phase 4 vertical slice',
  },
  {
    id: 'thread-pairing-gateway',
    workspaceId: 'pocket-agent',
    title: 'Pairing gateway follow-up',
    status: 'review',
    summary:
      'Controller lease conflicts and revoke flow are green. Remaining work is websocket transport and QR UX.',
    updatedAt: '16 min ago',
    turnCount: 8,
    planState: 'Queued for timeline approvals',
  },
  {
    id: 'thread-release-notes',
    workspaceId: 'release-hardening',
    title: 'Threat model drafting',
    status: 'idle',
    summary:
      'Capture default host posture, operator guidance, and contribution expectations before public release.',
    updatedAt: '1 h ago',
    turnCount: 5,
    planState: 'Waiting on hardening phase',
  },
];

export const timelineEntries: TimelineEntry[] = [
  {
    id: 'tl-1',
    threadId: 'thread-mobile-shell',
    title: 'Reconnect UX stubbed',
    status: 'event',
    summary:
      'Client badges switch between steady, degraded, and replaying states.',
    meta: 'transport',
  },
  {
    id: 'tl-2',
    threadId: 'thread-mobile-shell',
    title: 'Workspace summary linked',
    status: 'event',
    summary:
      'The shell can jump from workspace dashboard into thread detail without exposing raw host internals.',
    meta: 'navigation',
  },
  {
    id: 'tl-3',
    threadId: 'thread-mobile-shell',
    title: 'Composer staged',
    status: 'draft',
    summary:
      'Controller sees a host-routed composer surface with steer, interrupt, and approval context labels.',
    meta: 'composer',
  },
];

export function getWorkspace(workspaceId: string) {
  return workspaces.find((workspace) => workspace.id === workspaceId);
}

export function getWorkspaceThreads(workspaceId: string) {
  return threads.filter((thread) => thread.workspaceId === workspaceId);
}

export function getThread(threadId: string) {
  return threads.find((thread) => thread.id === threadId);
}

export function getThreadTimeline(threadId: string) {
  return timelineEntries.filter((entry) => entry.threadId === threadId);
}
