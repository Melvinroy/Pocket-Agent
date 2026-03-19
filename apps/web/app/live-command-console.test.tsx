import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LiveCommandConsole } from './live-command-console';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  private readonly listeners = new Map<
    string,
    Array<(event: { data?: string }) => void>
  >();

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
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

describe('LiveCommandConsole', () => {
  afterEach(() => {
    cleanup();
    MockWebSocket.instances = [];
    vi.unstubAllGlobals();
  });

  it('renders existing command output', () => {
    render(
      <LiveCommandConsole
        threadId="thread-1"
        initialLogs={[
          {
            id: 'command-1',
            threadId: 'thread-1',
            preset: 'test',
            cwd: '.worktrees/mobile',
            exitCode: 0,
            stdout: '35 passed',
            stderr: '',
            createdAt: 'now',
          },
        ]}
        transport={{
          enabled: false,
          websocketUrl: null,
          accessToken: null,
        }}
      />,
    );

    expect(screen.getByText('test | exit 0')).toBeTruthy();
    expect(screen.getByText('35 passed')).toBeTruthy();
  });

  it('appends websocket command output events', async () => {
    vi.stubGlobal('WebSocket', MockWebSocket);

    render(
      <LiveCommandConsole
        threadId="thread-1"
        initialLogs={[]}
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
        type: 'timeline.event',
        threadId: 'thread-1',
        entry: {
          sequence: 3,
          name: 'turn.output',
          createdAt: '2026-03-19T10:00:00.000Z',
          payload: {
            preset: 'lint',
            cwd: '.worktrees/mobile',
            exitCode: 0,
            stdout: 'eslint apps packages',
            stderr: '',
          },
        },
      }),
    });

    await waitFor(() => {
      expect(screen.getByText('lint | exit 0')).toBeTruthy();
      expect(screen.getByText('eslint apps packages')).toBeTruthy();
    });
  });
});
