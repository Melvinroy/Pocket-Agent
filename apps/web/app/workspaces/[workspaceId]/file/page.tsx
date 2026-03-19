import React from 'react';
import Link from 'next/link';

import { PhoneShell, SectionCard } from '@pocket-agent/ui';

import { FileEditor } from '../../../file-editor';
import { getWorkspaceFileView } from '../../../live-data';

export default async function WorkspaceFilePage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ path?: string }>;
}) {
  const { workspaceId } = await params;
  const { path } = await searchParams;

  if (!path) {
    return (
      <PhoneShell
        eyebrow="Pocket Agent"
        title="File missing"
        description="Select a changed file from a workspace or thread view to open the host-routed editor."
      >
        <SectionCard
          title="Recover"
          subtitle="Return to the workspace and choose a file from the changed file list."
        >
          <Link href={`/workspaces/${workspaceId}`} style={{ fontWeight: 700 }}>
            Back to workspace
          </Link>
        </SectionCard>
      </PhoneShell>
    );
  }

  const view = await getWorkspaceFileView(workspaceId, path);

  return (
    <PhoneShell
      eyebrow={view.workspace?.name ?? 'Pocket Agent'}
      title={view.file.path}
      description="Inspect and edit host workspace files through the gateway without exposing the desktop filesystem directly to the client."
    >
      <SectionCard
        title="File editor"
        subtitle="Changes save through the host policy boundary and stay controller-gated."
      >
        <FileEditor
          workspaceId={workspaceId}
          path={view.file.path}
          initialContents={view.file.contents}
          editable={view.transport.enabled && view.shell.role === 'controller'}
        />
      </SectionCard>
    </PhoneShell>
  );
}
