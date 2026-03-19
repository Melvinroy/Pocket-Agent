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

export type ApprovalSummary = {
  id: string;
  threadId: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  summary: string;
};

export type FileChangeSummary = {
  id: string;
  workspaceId: string;
  threadId: string;
  path: string;
  status: 'modified' | 'new';
  summary: string;
};

export type WorktreeSummary = {
  id: string;
  workspaceId: string;
  name: string;
  path: string;
  active: boolean;
};

export type TerminalPresetSummary = {
  id: string;
  threadId: string;
  preset: 'lint' | 'test' | 'build';
  cwd: string;
  status: 'idle' | 'ready' | 'last-run';
};

export type CommandLogSummary = {
  id: string;
  threadId: string;
  preset: 'lint' | 'test' | 'build';
  cwd: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  createdAt: string;
};

export type ReviewQueueItem = {
  id: string;
  workspaceId: string;
  threadId: string;
  title: string;
  status: 'pending' | 'active' | 'recent';
  summary: string;
  updatedAt: string;
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

export const approvals: ApprovalSummary[] = [
  {
    id: 'approval-mobile-shell',
    threadId: 'thread-mobile-shell',
    title: 'Allow host-side preview build',
    status: 'pending',
    summary:
      'Run the mobile shell build preset on the host before promoting the thread to review.',
  },
  {
    id: 'approval-pairing-gateway',
    threadId: 'thread-pairing-gateway',
    title: 'Open websocket transport port',
    status: 'approved',
    summary:
      'Transport upgrade was approved after localhost policy and revoke flow checks passed.',
  },
];

export const fileChanges: FileChangeSummary[] = [
  {
    id: 'file-1',
    workspaceId: 'pocket-agent',
    threadId: 'thread-mobile-shell',
    path: 'apps/web/app/screens.tsx',
    status: 'modified',
    summary: 'Thread shell now shows approval sheets and controller actions.',
  },
  {
    id: 'file-2',
    workspaceId: 'pocket-agent',
    threadId: 'thread-mobile-shell',
    path: 'apps/hostd/src/lib/gateway.ts',
    status: 'modified',
    summary:
      'Gateway exposes timeline, file, and review routes behind host auth.',
  },
  {
    id: 'file-3',
    workspaceId: 'release-hardening',
    threadId: 'thread-release-notes',
    path: 'docs/threat-model.md',
    status: 'new',
    summary: 'Initial operator threat model outline.',
  },
];

export const worktrees: WorktreeSummary[] = [
  {
    id: 'wt-root',
    workspaceId: 'pocket-agent',
    name: 'root',
    path: 'C:/Users/melvi/OneDrive/Desktop/Pocket Agent',
    active: false,
  },
  {
    id: 'wt-mobile',
    workspaceId: 'pocket-agent',
    name: 'feature-mobile',
    path: 'C:/Users/melvi/OneDrive/Desktop/Pocket Agent/.worktrees/feature-mobile',
    active: true,
  },
];

export const terminalPresets: TerminalPresetSummary[] = [
  {
    id: 'preset-1',
    threadId: 'thread-mobile-shell',
    preset: 'test',
    cwd: '.worktrees/feature-mobile',
    status: 'last-run',
  },
  {
    id: 'preset-2',
    threadId: 'thread-mobile-shell',
    preset: 'lint',
    cwd: '.worktrees/feature-mobile',
    status: 'ready',
  },
  {
    id: 'preset-3',
    threadId: 'thread-release-notes',
    preset: 'build',
    cwd: 'root',
    status: 'idle',
  },
];

export const commandLogs: CommandLogSummary[] = [
  {
    id: 'command-1',
    threadId: 'thread-mobile-shell',
    preset: 'test',
    cwd: '.worktrees/feature-mobile',
    exitCode: 0,
    stdout: 'vitest run --coverage\n35 passed\n',
    stderr: '',
    createdAt: '1 min ago',
  },
];

export const reviewQueue: ReviewQueueItem[] = [
  {
    id: 'review-1',
    workspaceId: 'pocket-agent',
    threadId: 'thread-pairing-gateway',
    title: 'Pairing gateway transport review',
    status: 'active',
    summary:
      'Review is active on the pairing gateway follow-up thread while websocket rollout is verified.',
    updatedAt: '16 min ago',
  },
  {
    id: 'review-2',
    workspaceId: 'pocket-agent',
    threadId: 'thread-mobile-shell',
    title: 'Mobile shell preview build approval',
    status: 'pending',
    summary:
      'A pending approval is blocking the next review handoff for the mobile shell thread.',
    updatedAt: '2 min ago',
  },
  {
    id: 'review-3',
    workspaceId: 'release-hardening',
    threadId: 'thread-release-notes',
    title: 'Threat model draft follow-up',
    status: 'recent',
    summary:
      'The last host review started from the editor and is waiting for the next operator pass.',
    updatedAt: '1 h ago',
  },
];

const fileContentsByWorkspace: Record<string, Record<string, string>> = {
  'pocket-agent': {
    'apps/web/app/screens.tsx':
      "export function ThreadScreen() {\n  return 'host-routed';\n}\n",
    'apps/hostd/src/lib/gateway.ts':
      "export function createHostGateway() {\n  return { status: 'ready' };\n}\n",
  },
  'release-hardening': {
    'docs/threat-model.md':
      '# Threat Model\n\nDocument operator-facing risks.\n',
  },
};

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

export function getThreadApprovals(threadId: string) {
  return approvals.filter((approval) => approval.threadId === threadId);
}

export function getWorkspaceFiles(workspaceId: string) {
  return fileChanges.filter((file) => file.workspaceId === workspaceId);
}

export function getThreadFiles(threadId: string) {
  return fileChanges.filter((file) => file.threadId === threadId);
}

export function getWorkspaceWorktrees(workspaceId: string) {
  return worktrees.filter((worktree) => worktree.workspaceId === workspaceId);
}

export function getThreadPresets(threadId: string) {
  return terminalPresets.filter((preset) => preset.threadId === threadId);
}

export function getThreadCommandLogs(threadId: string) {
  return commandLogs.filter((commandLog) => commandLog.threadId === threadId);
}

export function getWorkspaceFileContent(workspaceId: string, path: string) {
  return (
    fileContentsByWorkspace[workspaceId]?.[path] ??
    `// No seeded content for ${path}\n`
  );
}

export function getReviewQueueItems() {
  return reviewQueue;
}
