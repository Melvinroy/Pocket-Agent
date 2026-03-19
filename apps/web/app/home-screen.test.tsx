import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { HomeScreen } from './screens';

describe('HomeScreen', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a cross-workspace review queue on the home screen', () => {
    render(
      <HomeScreen
        reviewQueueItems={[
          {
            id: 'review-1',
            workspaceId: 'pocket-agent',
            threadId: 'thread-1',
            title: 'Pairing gateway transport review',
            status: 'active',
            summary: 'Review is active and waiting for the next host pass.',
            updatedAt: '16 min ago',
          },
          {
            id: 'review-2',
            workspaceId: 'release-hardening',
            threadId: 'thread-2',
            title: 'Threat model approval gate',
            status: 'pending',
            summary: 'A host approval is blocking the next review handoff.',
            updatedAt: '1 h ago',
          },
        ]}
      />,
    );

    expect(screen.getByText('Review queue')).toBeTruthy();
    expect(screen.getByText('Pairing gateway transport review')).toBeTruthy();
    expect(screen.getByText('Threat model approval gate')).toBeTruthy();

    const reviewLink = screen.getByRole('link', {
      name: 'Pairing gateway transport review',
    });

    expect(reviewLink.getAttribute('href')).toBe(
      '/workspaces/pocket-agent/threads/thread-1',
    );
  });
});
