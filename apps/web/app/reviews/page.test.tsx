import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ReviewQueuePage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe('review queue route', () => {
  it('renders review history with queue items', async () => {
    render(await ReviewQueuePage());

    expect(screen.getByText('Review history')).toBeTruthy();
    expect(screen.getByText('Queue posture')).toBeTruthy();
    expect(screen.getByText('Review items')).toBeTruthy();
    expect(screen.getByText('Pairing gateway transport review')).toBeTruthy();
  });
});
