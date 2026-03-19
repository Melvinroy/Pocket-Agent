import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import HomePage from './page.js';
import { ThreadScreen, WorkspaceScreen } from './screens.js';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe('mobile shell routes', () => {
  it('renders the home dashboard with workspace links', async () => {
    render(await HomePage());

    expect(
      screen.getByText('Host-controlled coding from the phone'),
    ).toBeTruthy();
    expect(screen.getAllByText('Pocket Agent').length).toBeGreaterThan(1);
    expect(screen.getByText('Bridge Lab')).toBeTruthy();
    expect(screen.getByText('Open active thread')).toBeTruthy();
    expect(screen.getByText('Start pairing')).toBeTruthy();
  });

  it('renders workspace detail state', () => {
    render(<WorkspaceScreen workspaceId="pocket-agent" />);

    expect(
      screen.getAllByText('Melvinroy/Pocket-Agent').length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Lease state')).toBeTruthy();
    expect(screen.getByText('Changed files')).toBeTruthy();
    expect(screen.getByText('Worktrees')).toBeTruthy();
    expect(screen.getByText('Pairing gateway follow-up')).toBeTruthy();
  });

  it('renders thread detail and composer state', () => {
    render(
      <ThreadScreen
        workspaceId="pocket-agent"
        threadId="thread-mobile-shell"
      />,
    );

    expect(screen.getByText('Session state')).toBeTruthy();
    expect(screen.getByText('Controller actions')).toBeTruthy();
    expect(
      screen.getAllByText('Allow host-side preview build').length,
    ).toBeGreaterThan(1);
    expect(screen.getByText('Files and review')).toBeTruthy();
    expect(
      screen.getAllByText('apps/hostd/src/lib/gateway.ts').length,
    ).toBeGreaterThan(1);
    expect(screen.getByText('Terminal presets')).toBeTruthy();
    expect(screen.getByText('feature-mobile')).toBeTruthy();
    expect(screen.getByText('Send a steer or continue prompt')).toBeTruthy();
    expect(screen.getByText('Reconnect UX stubbed')).toBeTruthy();
  });
});
