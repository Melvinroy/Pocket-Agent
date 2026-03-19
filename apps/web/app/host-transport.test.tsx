import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LiveCommandConsole } from './live-command-console';
import { resetHostTransportForTests } from './host-transport';
import { LiveTimeline } from './live-timeline';

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

describe('host transport sharing', () => {
  afterEach(() => {
    cleanup();
    resetHostTransportForTests();
    MockWebSocket.instances = [];
    vi.unstubAllGlobals();
  });

  it('reuses one websocket connection across thread live views', async () => {
    vi.stubGlobal('WebSocket', MockWebSocket);

    render(
      <>
        <LiveTimeline
          threadId="thread-1"
          initialItems={[]}
          transport={{
            enabled: true,
            websocketUrl: 'ws://127.0.0.1:9000/api/ws',
            accessToken: 'token-1',
          }}
        />
        <LiveCommandConsole
          threadId="thread-1"
          initialLogs={[]}
          transport={{
            enabled: true,
            websocketUrl: 'ws://127.0.0.1:9000/api/ws',
            accessToken: 'token-1',
          }}
        />
      </>,
    );

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0]?.send).toHaveBeenCalledTimes(0);

    MockWebSocket.instances[0]?.emit('open', {});

    expect(MockWebSocket.instances[0]?.send).toHaveBeenCalledTimes(1);
    expect(MockWebSocket.instances[0]?.send).toHaveBeenCalledWith(
      JSON.stringify({
        action: 'subscribe',
        threadId: 'thread-1',
      }),
    );

    MockWebSocket.instances[0]?.emit('message', {
      data: JSON.stringify({
        type: 'timeline.event',
        threadId: 'thread-1',
        entry: {
          sequence: 4,
          name: 'turn.output',
          createdAt: '2026-03-19T10:00:00.000Z',
          payload: {
            preset: 'test',
            cwd: '.worktrees/mobile',
            exitCode: 0,
            stdout: 'all green',
            stderr: '',
          },
        },
      }),
    });

    await waitFor(() => {
      expect(screen.getAllByText('turn.output')).toHaveLength(2);
      expect(screen.getByText('test | exit 0')).toBeTruthy();
    });
  });
});
