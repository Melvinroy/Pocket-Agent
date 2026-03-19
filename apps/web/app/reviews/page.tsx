import React from 'react';

import { getReviewQueueView } from '../live-data';
import { ReviewQueueScreen } from '../screens';

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams?: Promise<{
    state?: string | string[];
    workspace?: string | string[];
  }>;
}) {
  const view = await getReviewQueueView();
  const resolvedSearchParams = searchParams
    ? await searchParams
    : { state: undefined, workspace: undefined };
  const activeStateFilter =
    resolvedSearchParams.state === 'pending' ||
    resolvedSearchParams.state === 'active' ||
    resolvedSearchParams.state === 'recent'
      ? resolvedSearchParams.state
      : 'all';
  const activeWorkspaceFilter =
    typeof resolvedSearchParams.workspace === 'string' &&
    resolvedSearchParams.workspace
      ? resolvedSearchParams.workspace
      : 'all';

  return (
    <ReviewQueueScreen
      shell={view.shell}
      reviewQueueItems={view.reviewQueue}
      activeStateFilter={activeStateFilter}
      activeWorkspaceFilter={activeWorkspaceFilter}
      transport={view.transport}
    />
  );
}
