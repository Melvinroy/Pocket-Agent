import React from 'react';

import { ThreadScreen } from '../../../../screens';

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ workspaceId: string; threadId: string }>;
}) {
  const { workspaceId, threadId } = await params;

  return <ThreadScreen workspaceId={workspaceId} threadId={threadId} />;
}
