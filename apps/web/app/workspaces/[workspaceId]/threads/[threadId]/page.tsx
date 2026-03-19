import React from 'react';

import { getThreadView } from '../../../../live-data';
import { ThreadScreen } from '../../../../screens';

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ workspaceId: string; threadId: string }>;
}) {
  const { workspaceId, threadId } = await params;

  const view = await getThreadView(workspaceId, threadId);

  return (
    <ThreadScreen
      workspaceId={workspaceId}
      threadId={threadId}
      shell={view.shell}
      workspaceData={view.workspace}
      threadData={view.thread}
      timelineData={view.timeline}
      approvalsData={view.approvals}
      changedFilesData={view.files}
      presetsData={view.presets}
      transport={view.transport}
    />
  );
}
