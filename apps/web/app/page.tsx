import React from 'react';
import {
  PhoneShell,
  SectionCard,
  StatusPill,
  TimelinePreview,
} from '@codex-remote/ui';

const sampleThreads = [
  {
    id: 'thread-101',
    title: 'Bridge bootstrap',
    status: 'active',
    summary:
      'Handshake, capabilities, and event multiplexing skeleton are in flight.',
  },
  {
    id: 'thread-102',
    title: 'PWA shell',
    status: 'view-only',
    summary:
      'Mobile-first shell ready for remote presence, composer, and reconnect UX.',
  },
];

export default function HomePage() {
  return (
    <PhoneShell
      eyebrow="Codex Remote"
      title="Host-controlled coding from your phone"
      description="A mobile-first shell that keeps repositories, credentials, and execution on the host machine."
    >
      <SectionCard
        title="Controller policy"
        subtitle="The host remains authoritative while remote devices attach through a stable protocol."
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <StatusPill tone="success">localhost only</StatusPill>
          <StatusPill tone="neutral">network disabled</StatusPill>
          <StatusPill tone="warning">approvals on request</StatusPill>
        </div>
      </SectionCard>

      <SectionCard
        title="Active threads"
        subtitle="Resume, observe, or take control based on device lease state."
      >
        <TimelinePreview items={sampleThreads} />
      </SectionCard>
    </PhoneShell>
  );
}
