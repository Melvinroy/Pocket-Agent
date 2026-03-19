import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PhoneShell, TimelinePreview } from '../src/index.js';

describe('ui package', () => {
  it('renders the phone shell copy', () => {
    render(
      <PhoneShell eyebrow="Codex Remote" title="Title" description="Desc">
        <div>Body</div>
      </PhoneShell>,
    );

    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
  });

  it('renders timeline rows', () => {
    render(
      <TimelinePreview
        items={[
          {
            id: '1',
            title: 'Bridge bootstrap',
            status: 'active',
            summary: 'Running',
          },
        ]}
      />,
    );

    expect(screen.getByText('Bridge bootstrap')).toBeTruthy();
    expect(screen.getByText('Running')).toBeTruthy();
  });
});
