import React from 'react';

import { ConnectPanel } from './connect-panel';
import { getHomeView } from './live-data';
import { HomeScreen } from './screens';

export default async function HomePage() {
  const view = await getHomeView();

  return (
    <HomeScreen
      shell={view.shell}
      workspaceItems={view.workspaces}
      featuredThread={view.featuredThread}
      reviewQueueItems={view.reviewQueue}
      connectPanel={<ConnectPanel connected={view.transport.enabled} />}
      transport={view.transport}
    />
  );
}
