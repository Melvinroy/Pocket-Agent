import React from 'react';

import { WorkspaceScreen } from '../../screens';

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return <WorkspaceScreen workspaceId={workspaceId} />;
}
