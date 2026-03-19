import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ReviewLauncher } from './review-launcher';

const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

describe('ReviewLauncher', () => {
  beforeEach(() => {
    refreshMock.mockReset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('disables review start when the controller is not active', () => {
    render(
      <ReviewLauncher threadId="thread-1" path="README.md" enabled={false} />,
    );

    expect(
      (
        screen.getByRole('button', {
          name: 'Start host review',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it('starts host review through the web proxy', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ accepted: true }), {
        status: 202,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    render(<ReviewLauncher threadId="thread-1" path="README.md" enabled />);

    fireEvent.click(screen.getByRole('button', { name: 'Start host review' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/host/threads/thread-1/review',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            path: 'README.md',
            summary: 'Review README.md after web edit',
          }),
        },
      );
      expect(refreshMock).toHaveBeenCalled();
    });
  });
});
