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

    fireEvent.click(screen.getByRole('button', { name: 'Start pairing' }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Confirm pairing' }),
      ).toBeTruthy();
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
});
