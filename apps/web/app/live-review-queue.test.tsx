import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LiveReviewQueue } from './live-review-queue';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  private readonly listeners = new Map<
    string,
    Array<(event: { data?: string }) => void>
  >();
  readyState = 0;

  constructor(public readonly url: string | URL) {
    MockWebSocket.instances.push(this);
  }

  addEventListener(type: string, listener: (event: { data?: string }) => void) {
    const current = this.listeners.get(type) ?? [];
    current.push(listener);
    this.listeners.set(type, current);
  }

  send = vi.fn();
  close = vi.fn();

  emit(type: string, event: { data?: string }) {
    if (type === 'open') {
      this.readyState = MockWebSocket.OPEN;
    }

    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

describe('LiveReviewQueue', () => {
  afterEach(() => {
    cleanup();
    MockWebSocket.instances = [];
    vi.unstubAllGlobals();
  });

  it('renders existing review queue items', () => {
    render(
      <LiveReviewQueue
        initialItems={[
          {
            id: 'review-1',
            workspaceId: 'pocket-agent',
            threadId: 'thread-1',
            title: 'Pairing gateway transport review',
            status: 'active',
            summary: 'Review is active.',
            updatedAt: 'now',
          },
        ]}
        activeStateFilter="all"
        activeWorkspaceFilter="all"
        transport={{
          enabled: false,
          websocketUrl: null,
          accessToken: null,
        }}
      />,
    );

    expect(screen.getByText('Queue posture')).toBeTruthy();
    expect(screen.getByText('Pairing gateway transport review')).toBeTruthy();
  });

  it('replaces the queue when a websocket snapshot arrives', async () => {
    vi.stubGlobal('WebSocket', MockWebSocket);

    render(
      <LiveReviewQueue
        initialItems={[]}
        activeStateFilter="all"
        activeWorkspaceFilter="all"
        transport={{
          enabled: true,
          websocketUrl: 'ws://127.0.0.1:9000/api/ws',
          accessToken: 'token-1',
        }}
      />,
    );

    const socket = MockWebSocket.instances[0];
    socket.emit('open', {});
    socket.emit('message', {
      data: JSON.stringify({
        type: 'reviews.snapshot',
        items: [
          {
            id: 'review-2',
            workspaceId: 'pocket-agent',
            threadId: 'thread-2',
            title: 'Mobile shell preview build approval',
            status: 'pending',
            summary: 'Pending approval gate.',
            updatedAt: '2026-03-19T10:00:00.000Z',
          },
        ],
      }),
    });

    await waitFor(() => {
      expect(
        screen.getByRole('link', {
          name: 'Mobile shell preview build approval',
        }),
      ).toBeTruthy();
    });
  });
});
