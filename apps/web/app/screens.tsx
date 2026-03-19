import React from 'react';
import Link from 'next/link';

import {
  ActionStrip,
  ComposerCard,
  DetailList,
  PhoneShell,
  SectionCard,
  StatGrid,
  StatusPill,
  TimelinePreview,
} from '@pocket-agent/ui';

import type { ShellStateView, TransportConfig } from './live-data';
import { LiveTimeline } from './live-timeline';
import { ThreadActions } from './thread-actions';
import {
  type ApprovalSummary,
  type FileChangeSummary,
  getThread,
  getThreadApprovals,
  getThreadFiles,
  getThreadPresets,
  getThreadTimeline,
  type TerminalPresetSummary,
  type ThreadSummary,
  type TimelineEntry,
  type WorktreeSummary,
  type WorkspaceSummary,
  getWorkspace,
  getWorkspaceFiles,
  getWorkspaceWorktrees,
  getWorkspaceThreads,
  shellState,
  threads,
  workspaces,
} from './mock-data';

function workspaceTone(status: string) {
  if (status === 'active') {
    return 'success';
  }

  if (status === 'reconnecting') {
    return 'warning';
  }

  return 'neutral';
}

function threadTone(status: string) {
  if (status === 'streaming') {
    return 'success';
  }

  if (status === 'review') {
    return 'warning';
  }

  return 'neutral';
}

function approvalTone(status: string) {
  if (status === 'approved') {
    return 'success';
  }

  if (status === 'rejected') {
    return 'danger';
  }

  return 'warning';
}

function ShellMeta({ shell }: { shell: ShellStateView }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
      }}
    >
      <StatusPill tone="success">{shell.connection}</StatusPill>
      <StatusPill tone="neutral">{shell.role}</StatusPill>
    </div>
  );
}

export function HomeScreen({
  shell = shellState,
  workspaceItems = workspaces,
  featuredThread = threads[0] ?? null,
  connectPanel,
}: {
  shell?: ShellStateView;
  workspaceItems?: WorkspaceSummary[];
  featuredThread?: ThreadSummary | null;
  connectPanel?: React.ReactNode;
}) {
  return (
    <PhoneShell
      eyebrow="Pocket Agent"
      title="Host-controlled coding from the phone"
      description="Continue active Codex sessions from mobile or web while the desktop host keeps the repository, credentials, execution, and policy boundary."
      meta={<ShellMeta shell={shell} />}
    >
      <SectionCard
        title="Remote posture"
        subtitle="One controller holds the lease, viewers stay read-only, and every action routes through the host gateway."
      >
        <StatGrid
          items={[
            {
              label: 'Connection',
              value: shell.connection,
              hint: shell.reconnectLabel,
            },
            {
              label: 'Workspaces',
              value: String(workspaceItems.length),
              hint: 'host-known repos',
            },
            {
              label: 'Active role',
              value: shell.role,
              hint: shell.deviceName,
            },
          ]}
        />
        {connectPanel ? (
          <div style={{ marginTop: 16 }}>{connectPanel}</div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Workspaces"
        subtitle="Jump into a bound repository, inspect its lease state, and continue the active thread."
        action={<StatusPill tone="neutral">PWA shell</StatusPill>}
      >
        <DetailList
          items={workspaceItems.map((workspace) => ({
            id: workspace.id,
            title: (
              <Link
                href={`/workspaces/${workspace.id}`}
                style={{ textDecoration: 'none' }}
              >
                {workspace.name}
              </Link>
            ),
            body: (
              <>
                <div>{workspace.repo}</div>
                <div>
                  {workspace.branch} | {workspace.presence}
                </div>
                {workspace.warning ? <div>{workspace.warning}</div> : null}
              </>
            ),
            badge: (
              <StatusPill tone={workspaceTone(workspace.status)}>
                {workspace.status}
              </StatusPill>
            ),
          }))}
        />
      </SectionCard>

      <SectionCard
        title="Featured thread"
        subtitle="Phase 4 centers on thread detail, composer state, reconnect handling, and presence cues."
      >
        {featuredThread ? (
          <>
            <TimelinePreview
              items={[
                {
                  id: featuredThread.id,
                  title: featuredThread.title,
                  status: featuredThread.status,
                  summary: featuredThread.summary,
                  meta: `${featuredThread.updatedAt} | ${featuredThread.planState}`,
                },
              ]}
            />
            <div style={{ marginTop: 12 }}>
              <Link
                href={`/workspaces/${featuredThread.workspaceId}/threads/${featuredThread.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 46,
                  padding: '0 18px',
                  borderRadius: 999,
                  background: '#142b28',
                  color: '#f6f2e8',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Open active thread
              </Link>
            </div>
          </>
        ) : (
          <StatusPill tone="neutral">No active thread</StatusPill>
        )}
      </SectionCard>
    </PhoneShell>
  );
}

export function WorkspaceScreen({
  workspaceId,
  shell = shellState,
  workspaceData,
  workspaceThreadsData,
  workspaceFilesData,
  workspaceWorktreesData,
}: {
  workspaceId: string;
  shell?: ShellStateView;
  workspaceData?: WorkspaceSummary | null;
  workspaceThreadsData?: ThreadSummary[];
  workspaceFilesData?: FileChangeSummary[];
  workspaceWorktreesData?: WorktreeSummary[];
}) {
  const workspace = workspaceData ?? getWorkspace(workspaceId);

  if (!workspace) {
    return (
      <PhoneShell
        eyebrow="Pocket Agent"
        title="Workspace missing"
        description="The selected workspace is not available in the local shell seed data."
        meta={<ShellMeta shell={shell} />}
      >
        <SectionCard
          title="Return home"
          subtitle="The host still remains authoritative even when the client route is stale."
        >
          <Link href="/" style={{ fontWeight: 700 }}>
            Back to dashboard
          </Link>
        </SectionCard>
      </PhoneShell>
    );
  }

  const workspaceThreads =
    workspaceThreadsData ?? getWorkspaceThreads(workspace.id);
  const workspaceFiles = workspaceFilesData ?? getWorkspaceFiles(workspace.id);
  const workspaceWorktrees =
    workspaceWorktreesData ?? getWorkspaceWorktrees(workspace.id);

  return (
    <PhoneShell
      eyebrow={workspace.name}
      title={workspace.repo}
      description="Workspace detail shows branch, controller, thread list, and safe next actions without granting direct filesystem access."
      meta={<ShellMeta shell={shell} />}
    >
      <SectionCard
        title="Lease state"
        subtitle="The client reflects the host controller lease and reconnect posture."
      >
        <StatGrid
          items={[
            { label: 'Branch', value: workspace.branch, hint: 'host worktree' },
            {
              label: 'Threads',
              value: String(workspace.threads),
              hint: workspace.presence,
            },
            {
              label: 'Controller',
              value: workspace.controller,
              hint: 'single active controller',
            },
          ]}
        />
      </SectionCard>

      <SectionCard
        title="Next actions"
        subtitle="Guide the active device back into the right coding surface."
      >
        <ActionStrip
          items={[
            {
              label: 'Resume last thread',
              hint: workspaceThreads[0]?.title ?? 'No threads yet',
              tone: 'accent',
            },
            {
              label: 'Reconnect host',
              hint: workspace.warning ?? 'Heartbeat healthy',
              tone: 'muted',
            },
            {
              label: 'Review controller lease',
              hint: workspace.controller,
              tone: 'muted',
            },
          ]}
        />
      </SectionCard>

      <SectionCard
        title="Threads"
        subtitle="The workspace shell exposes resumable thread state with plan context and last activity."
      >
        <DetailList
          items={workspaceThreads.map((thread) => ({
            id: thread.id,
            title: (
              <Link
                href={`/workspaces/${workspace.id}/threads/${thread.id}`}
                style={{ textDecoration: 'none' }}
              >
                {thread.title}
              </Link>
            ),
            body: (
              <>
                <div>{thread.summary}</div>
                <div>
                  {thread.turnCount} turns | {thread.updatedAt}
                </div>
              </>
            ),
            badge: (
              <StatusPill tone={threadTone(thread.status)}>
                {thread.status}
              </StatusPill>
            ),
          }))}
        />
      </SectionCard>

      <SectionCard
        title="Changed files"
        subtitle="Open diff-linked files without giving the client direct filesystem access."
      >
        <DetailList
          items={workspaceFiles.map((file) => ({
            id: file.id,
            title: file.path,
            body: file.summary,
            badge: (
              <StatusPill tone={file.status === 'new' ? 'success' : 'neutral'}>
                {file.status}
              </StatusPill>
            ),
          }))}
        />
      </SectionCard>

      <SectionCard
        title="Worktrees"
        subtitle="Bind active threads to a host-side worktree before running presets."
      >
        <DetailList
          items={workspaceWorktrees.map((worktree) => ({
            id: worktree.id,
            title: worktree.name,
            body: worktree.path,
            badge: (
              <StatusPill tone={worktree.active ? 'success' : 'neutral'}>
                {worktree.active ? 'active' : 'available'}
              </StatusPill>
            ),
          }))}
        />
      </SectionCard>
    </PhoneShell>
  );
}

export function ThreadScreen({
  workspaceId,
  threadId,
  shell = shellState,
  workspaceData,
  threadData,
  timelineData,
  approvalsData,
  changedFilesData,
  presetsData,
  transport,
}: {
  workspaceId: string;
  threadId: string;
  shell?: ShellStateView;
  workspaceData?: WorkspaceSummary | null;
  threadData?: ThreadSummary | null;
  timelineData?: TimelineEntry[];
  approvalsData?: ApprovalSummary[];
  changedFilesData?: FileChangeSummary[];
  presetsData?: TerminalPresetSummary[];
  transport?: TransportConfig;
}) {
  const workspace = workspaceData ?? getWorkspace(workspaceId);
  const thread = threadData ?? getThread(threadId);
  const timeline = timelineData ?? getThreadTimeline(threadId);
  const approvals = approvalsData ?? getThreadApprovals(threadId);
  const changedFiles = changedFilesData ?? getThreadFiles(threadId);
  const presets = presetsData ?? getThreadPresets(threadId);

  if (!workspace || !thread) {
    return (
      <PhoneShell
        eyebrow="Pocket Agent"
        title="Thread missing"
        description="The requested thread could not be resolved from the host-backed route snapshot."
        meta={<ShellMeta shell={shell} />}
      >
        <SectionCard
          title="Recover"
          subtitle="Navigate back to a known workspace and rejoin from the host projection."
        >
          <Link href="/" style={{ fontWeight: 700 }}>
            Back to dashboard
          </Link>
        </SectionCard>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell
      eyebrow={workspace.name}
      title={thread.title}
      description="Thread detail combines presence, reconnect state, timeline context, and a host-routed composer surface for the active controller."
      meta={<ShellMeta shell={shell} />}
    >
      <SectionCard
        title="Session state"
        subtitle="This view is optimized for phone control without bypassing host policy."
      >
        <StatGrid
          items={[
            { label: 'Status', value: thread.status, hint: thread.updatedAt },
            {
              label: 'Turns',
              value: String(thread.turnCount),
              hint: 'stream + replay aware',
            },
            {
              label: 'Presence',
              value: workspace.presence,
              hint: shell.deviceName,
            },
          ]}
        />
      </SectionCard>

      <SectionCard
        title="Timeline"
        subtitle="Plan and transport state preview the live timeline phase without exposing raw host internals."
        action={<StatusPill tone="warning">reconnect aware</StatusPill>}
      >
        <LiveTimeline
          threadId={threadId}
          initialItems={timeline}
          transport={
            transport ?? {
              enabled: false,
              websocketUrl: null,
              accessToken: null,
            }
          }
        />
      </SectionCard>

      <SectionCard
        title="Controller actions"
        subtitle="Steer, interrupt, and approval handling stay controller-gated on the host."
      >
        <ThreadActions
          threadId={threadId}
          approvals={approvals}
          enabled={transport?.enabled === true && shell.role === 'controller'}
        />
      </SectionCard>

      <SectionCard
        title="Approvals"
        subtitle="Approval sheets give the controller enough context to decide without exposing host secrets."
      >
        <DetailList
          items={approvals.map((approval) => ({
            id: approval.id,
            title: approval.title,
            body: approval.summary,
            badge: (
              <StatusPill tone={approvalTone(approval.status)}>
                {approval.status}
              </StatusPill>
            ),
          }))}
        />
      </SectionCard>

      <SectionCard
        title="Files and review"
        subtitle="Open changed files from the diff, make a light edit, and start a host-side review pass."
      >
        <DetailList
          items={changedFiles.map((file) => ({
            id: file.id,
            title: file.path,
            body: file.summary,
            badge: (
              <StatusPill tone={file.status === 'new' ? 'success' : 'neutral'}>
                {file.status}
              </StatusPill>
            ),
          }))}
        />
      </SectionCard>

      <SectionCard
        title="Terminal presets"
        subtitle="Host-side lint, test, and build actions run inside the bound worktree cwd."
      >
        <DetailList
          items={presets.map((preset) => ({
            id: preset.id,
            title: preset.preset,
            body: `${preset.cwd} | ${preset.status}`,
            badge: (
              <StatusPill
                tone={
                  preset.status === 'last-run'
                    ? 'success'
                    : preset.status === 'ready'
                      ? 'warning'
                      : 'neutral'
                }
              >
                {preset.status}
              </StatusPill>
            ),
          }))}
        />
      </SectionCard>

      <SectionCard
        title="Composer"
        subtitle="The controller composes instructions here; the host decides whether the action runs, waits for approval, or is rejected by policy."
      >
        <ComposerCard
          title="Send a steer or continue prompt"
          placeholder="Ask Codex to continue the current milestone, explain a diff, or interrupt safely. This is a routed shell preview, not a direct App Server connection."
          footer={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatusPill tone="success">controller active</StatusPill>
              <StatusPill tone="neutral">host-routed</StatusPill>
              <StatusPill tone="warning">approvals on request</StatusPill>
            </div>
          }
        />
      </SectionCard>
    </PhoneShell>
  );
}
