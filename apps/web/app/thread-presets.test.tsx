import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThreadPresets } from './thread-presets';

const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

describe('ThreadPresets', () => {
  beforeEach(() => {
    refreshMock.mockReset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const seededTransport = {
    enabled: false,
    websocketUrl: null,
    accessToken: null,
  } as const;

  it('disables preset actions when the device is not the active controller', () => {
    render(
      <ThreadPresets
        threadId="thread-1"
        enabled={false}
        presets={[
          {
            id: 'preset-1',
            threadId: 'thread-1',
            preset: 'lint',
            cwd: '.worktrees/mobile',
            status: 'ready',
          },
        ]}
        transport={seededTransport}
      />,
    );

    expect(
      (screen.getByRole('button', { name: 'Run lint' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      screen.getByText(
        'Pair as the active controller to run host terminal presets.',
      ),
    ).toBeTruthy();
  });

  it('runs a host preset through the web proxy and refreshes the route', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ result: { exitCode: 0 } }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    render(
      <ThreadPresets
        threadId="thread-1"
        enabled
        presets={[
          {
            id: 'preset-1',
            threadId: 'thread-1',
            preset: 'test',
            cwd: '.worktrees/mobile',
            status: 'ready',
          },
        ]}
        transport={seededTransport}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Run test' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/host/threads/thread-1/commands/preset',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            preset: 'test',
          }),
        },
      );
      expect(refreshMock).toHaveBeenCalled();
    });
  });
});
