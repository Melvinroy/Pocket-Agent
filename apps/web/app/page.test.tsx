import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from './page.js';

describe('HomePage', () => {
  it('renders the mobile-first shell summary', () => {
    render(<HomePage />);

    expect(
      screen.getByText('Host-controlled coding from your phone'),
    ).toBeTruthy();
    expect(screen.getByText('Bridge bootstrap')).toBeTruthy();
  });
});
