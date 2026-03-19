import React from 'react';

import { getReviewQueueView } from '../live-data';
import { ReviewQueueScreen } from '../screens';

export default async function ReviewQueuePage() {
  const view = await getReviewQueueView();

  return (
    <ReviewQueueScreen shell={view.shell} reviewQueueItems={view.reviewQueue} />
  );
}
