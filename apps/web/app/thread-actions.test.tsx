import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThreadActions } from './thread-actions';

const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

describe('ThreadActions', () => {
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

  it('disables controller actions when the session is not controller-enabled', () => {
    render(
      <ThreadActions
        threadId="thread-1"
        approvals={[]}
        enabled={false}
        transport={seededTransport}
      />,
    );

    expect(
      (
        screen.getByRole('button', {
          name: 'Send steer request',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole('button', {
          name: 'Interrupt thread',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      screen.getByText(
        'Pair as the active controller to enable host-routed actions.',
      ),
    ).toBeTruthy();
  });

  it('posts steer requests and refreshes the route on success', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ accepted: true }), {
        status: 202,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    render(
      <ThreadActions
        threadId="thread-1"
        approvals={[]}
        enabled
        transport={seededTransport}
      />,
    );

    fireEvent.change(screen.getByLabelText('Steer the next turn'), {
      target: {
        value: 'Continue the release hardening pass',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send steer request' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/host/threads/thread-1/steer',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            instruction: 'Continue the release hardening pass',
          }),
        },
      );
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it('posts approval decisions through the web proxy', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ approval: { status: 'approved' } }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    render(
      <ThreadActions
        threadId="thread-1"
        approvals={[
          {
            id: 'approval-1',
            threadId: 'thread-1',
            title: 'Allow network access',
            status: 'pending',
            summary: 'Temporary host-side network access',
          },
        ]}
        enabled
        transport={seededTransport}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/host/approvals/approval-1/resolve',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            decision: 'approved',
          }),
        },
      );
      expect(refreshMock).toHaveBeenCalled();
    });
  });
});
