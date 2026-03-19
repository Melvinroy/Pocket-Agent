import React from 'react';

import { getWorkspaceView } from '../../live-data';
import { WorkspaceScreen } from '../../screens';

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const view = await getWorkspaceView(workspaceId);

  return (
    <WorkspaceScreen
      workspaceId={workspaceId}
      shell={view.shell}
      workspaceData={view.workspace}
      workspaceThreadsData={view.threads}
      workspaceFilesData={view.files}
      workspaceWorktreesData={view.worktrees}
    />
  );
}
