import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  ComposerCard,
  PhoneShell,
  StatGrid,
  TimelinePreview,
} from '../src/index.js';

describe('ui package', () => {
  it('renders the phone shell copy', () => {
    render(
      <PhoneShell eyebrow="Pocket Agent" title="Title" description="Desc">
        <div>Body</div>
      </PhoneShell>,
    );

    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
  });

  it('renders timeline rows and stat blocks', () => {
    render(
      <>
        <StatGrid
          items={[{ label: 'Connection', value: 'steady', hint: 'healthy' }]}
        />
        <TimelinePreview
          items={[
            {
              id: '1',
              title: 'Bridge bootstrap',
              status: 'active',
              summary: 'Running',
              meta: 'transport',
            },
          ]}
        />
      </>,
    );

    expect(screen.getByText('steady')).toBeTruthy();
    expect(screen.getByText('Bridge bootstrap')).toBeTruthy();
    expect(screen.getByText('transport')).toBeTruthy();
  });

  it('renders the composer card footer', () => {
    render(
      <ComposerCard
        title="Compose"
        placeholder="Prompt"
        footer={<div>Footer state</div>}
      />,
    );

    expect(screen.getByText('Compose')).toBeTruthy();
    expect(screen.getByText('Footer state')).toBeTruthy();
  });
});
