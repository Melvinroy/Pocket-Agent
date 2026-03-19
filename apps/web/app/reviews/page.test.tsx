import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ReviewQueuePage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe('review queue route', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders review history with queue items', async () => {
    render(await ReviewQueuePage({}));

    expect(screen.getByText('Review history')).toBeTruthy();
    expect(screen.getByText('Queue posture')).toBeTruthy();
    expect(screen.getByText('Review items')).toBeTruthy();
    expect(screen.getByText('Pairing gateway transport review')).toBeTruthy();
  });

  it('filters review history by state', async () => {
    render(
      await ReviewQueuePage({
        searchParams: Promise.resolve({ state: 'pending' }),
      }),
    );

    expect(
      screen.getByRole('link', { name: 'Mobile shell preview build approval' }),
    ).toBeTruthy();
    expect(screen.queryByText('Pairing gateway transport review')).toBeNull();
  });
});
