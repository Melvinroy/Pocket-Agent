'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  DetailList,
  SectionCard,
  StatGrid,
  StatusPill,
} from '@pocket-agent/ui';

import { subscribeToHostTransport } from './host-transport';
import type { TransportConfig } from './live-data';
import { getWorkspace, type ReviewQueueItem } from './mock-data';

interface LiveReviewQueueProps {
  initialItems: ReviewQueueItem[];
  activeStateFilter: 'all' | ReviewQueueItem['status'];
  activeWorkspaceFilter: string;
  transport: TransportConfig;
}

function reviewTone(status: ReviewQueueItem['status']) {
  if (status === 'active') {
    return 'success';
  }

  if (status === 'pending') {
    return 'warning';
  }

  return 'neutral';
}

export function LiveReviewQueue({
  initialItems,
  activeStateFilter,
  activeWorkspaceFilter,
  transport,
}: LiveReviewQueueProps) {
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    if (
      !transport.enabled ||
      !transport.websocketUrl ||
      !transport.accessToken
    ) {
      return;
    }

    return subscribeToHostTransport({
      websocketUrl: transport.websocketUrl,
      accessToken: transport.accessToken,
      reviewQueue: true,
      listener: (payload) => {
        const event = payload as
          | { type: 'ready' | 'reviews.subscribed' }
          | {
              type: 'reviews.snapshot';
              items: ReviewQueueItem[];
            };

        if (event.type !== 'reviews.snapshot') {
          return;
        }

        setItems(event.items);
      },
    });
  }, [transport.accessToken, transport.enabled, transport.websocketUrl]);

  const workspaceOptions = Array.from(
    new Set(items.map((item) => item.workspaceId)),
  ).map((workspaceId) => ({
    workspaceId,
    workspaceName: getWorkspace(workspaceId)?.name ?? workspaceId,
  }));
  const pendingCount = items.filter((item) => item.status === 'pending').length;
  const activeCount = items.filter((item) => item.status === 'active').length;
  const recentCount = items.filter((item) => item.status === 'recent').length;
  const filteredItems = items.filter((item) => {
    const matchesState =
      activeStateFilter === 'all' || item.status === activeStateFilter;
    const matchesWorkspace =
      activeWorkspaceFilter === 'all' ||
      item.workspaceId === activeWorkspaceFilter;

    return matchesState && matchesWorkspace;
  });

  return (
    <>
      <SectionCard
        title="Queue posture"
        subtitle="The dashboard keeps review work separated by state without exposing raw host internals."
      >
        <StatGrid
          items={[
            {
              label: 'Pending',
              value: String(pendingCount),
              hint: 'approval gates',
            },
            {
              label: 'Active',
              value: String(activeCount),
              hint: 'reviewing now',
            },
            {
              label: 'Recent',
              value: String(recentCount),
              hint: 'ready for follow-up',
            },
          ]}
        />
      </SectionCard>

      <SectionCard
        title="Review items"
        subtitle="Open the right thread directly from the review queue."
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          <Link href="/reviews" style={{ textDecoration: 'none' }}>
            <StatusPill
              tone={activeStateFilter === 'all' ? 'warning' : 'neutral'}
            >
              all states
            </StatusPill>
          </Link>
          <Link
            href="/reviews?state=pending"
            style={{ textDecoration: 'none' }}
          >
            <StatusPill
              tone={activeStateFilter === 'pending' ? 'warning' : 'neutral'}
            >
              pending {pendingCount}
            </StatusPill>
          </Link>
          <Link href="/reviews?state=active" style={{ textDecoration: 'none' }}>
            <StatusPill
              tone={activeStateFilter === 'active' ? 'success' : 'neutral'}
            >
              active {activeCount}
            </StatusPill>
          </Link>
          <Link href="/reviews?state=recent" style={{ textDecoration: 'none' }}>
            <StatusPill
              tone={activeStateFilter === 'recent' ? 'success' : 'neutral'}
            >
              recent {recentCount}
            </StatusPill>
          </Link>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          <Link href="/reviews" style={{ textDecoration: 'none' }}>
            <StatusPill
              tone={activeWorkspaceFilter === 'all' ? 'success' : 'neutral'}
            >
              all workspaces
            </StatusPill>
          </Link>
          {workspaceOptions.map((workspace) => (
            <Link
              key={workspace.workspaceId}
              href={`/reviews?workspace=${encodeURIComponent(workspace.workspaceId)}`}
              style={{ textDecoration: 'none' }}
            >
              <StatusPill
                tone={
                  activeWorkspaceFilter === workspace.workspaceId
                    ? 'success'
                    : 'neutral'
                }
              >
                {workspace.workspaceName}
              </StatusPill>
            </Link>
          ))}
        </div>
        {filteredItems.length > 0 ? (
          <DetailList
            items={filteredItems.map((reviewItem) => {
              const workspace = getWorkspace(reviewItem.workspaceId);

              return {
                id: reviewItem.id,
                title: (
                  <Link
                    href={`/workspaces/${reviewItem.workspaceId}/threads/${reviewItem.threadId}`}
                    style={{ textDecoration: 'none' }}
                  >
                    {reviewItem.title}
                  </Link>
                ),
                body: (
                  <>
                    <div>{reviewItem.summary}</div>
                    <div>
                      {workspace?.name ?? reviewItem.workspaceId} |{' '}
                      {reviewItem.updatedAt}
                    </div>
                  </>
                ),
                badge: (
                  <StatusPill tone={reviewTone(reviewItem.status)}>
                    {reviewItem.status}
                  </StatusPill>
                ),
              };
            })}
          />
        ) : (
          <StatusPill tone="neutral">
            No review items match this filter
          </StatusPill>
        )}
      </SectionCard>
    </>
  );
}
