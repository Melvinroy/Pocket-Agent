import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectPanel } from './connect-panel';

describe('ConnectPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows an actionable controller-lease conflict message', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            pairingSession: {
              id: 'pairing-1',
              confirmationCode: '123-456',
            },
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: 'Another controller device currently holds the active lease',
          }),
          {
            status: 409,
            headers: {
              'content-type': 'application/json',
            },
          },
        ),
      );

    render(<ConnectPanel connected={false} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Start controller pairing' }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Confirm pairing' }),
      ).toBeTruthy();
    });

    await waitFor(() => {
      expect(
        screen
          .getByRole('button', { name: 'Confirm pairing' })
          .hasAttribute('disabled'),
      ).toBe(false);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirm pairing' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(
        screen.getByText((content) =>
          content.includes('Another controller is already paired.'),
        ),
      ).toBeTruthy();
    });
  });

  it('starts viewer pairing when the fallback action is used', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          pairingSession: {
            id: 'pairing-2',
            confirmationCode: '654-321',
          },
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );

    render(<ConnectPanel connected={false} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Pair as viewer instead' }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/host/pairing/start', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hostUrl: 'http://127.0.0.1:43110',
          role: 'viewer',
        }),
      });
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Confirm pairing' }),
      ).toBeTruthy();
    });
    expect(screen.getByText('Code 654-321')).toBeTruthy();
  });
});
