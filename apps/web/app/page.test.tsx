import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from './page.js';
import { ThreadScreen, WorkspaceScreen } from './screens.js';

describe('mobile shell routes', () => {
  it('renders the home dashboard with workspace links', () => {
    render(<HomePage />);

    expect(
      screen.getByText('Host-controlled coding from the phone'),
    ).toBeTruthy();
    expect(screen.getAllByText('Pocket Agent').length).toBeGreaterThan(1);
    expect(screen.getByText('Bridge Lab')).toBeTruthy();
    expect(screen.getByText('Open active thread')).toBeTruthy();
  });

  it('renders workspace detail state', () => {
    render(<WorkspaceScreen workspaceId="pocket-agent" />);

    expect(
      screen.getAllByText('Melvinroy/Pocket-Agent').length,
    ).toBeGreaterThan(1);
    expect(screen.getByText('Lease state')).toBeTruthy();
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
    expect(screen.getByText('Send a steer or continue prompt')).toBeTruthy();
    expect(screen.getByText('Reconnect UX stubbed')).toBeTruthy();
  });
});
