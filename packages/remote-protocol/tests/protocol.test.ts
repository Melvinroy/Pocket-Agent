import { describe, expect, it } from 'vitest';

import {
  PROTOCOL_VERSION,
  createEventEnvelope,
  createRequestEnvelope,
  decodeEnvelope,
} from '../src/index.js';

describe('remote protocol', () => {
  it('creates typed request envelopes', () => {
    const request = createRequestEnvelope(
      'threads.create',
      { workspaceId: 'workspace-1' },
      'req-1',
    );

    expect(request.protocolVersion).toBe(PROTOCOL_VERSION);
    expect(request.kind).toBe('request');
    expect(request.name).toBe('threads.create');
  });

  it('decodes event fixtures', () => {
    const event = createEventEnvelope(
      'turn.plan',
      { steps: ['bootstrap'] },
      'evt-1',
    );
    const decoded = decodeEnvelope(event);

    expect(decoded.kind).toBe('event');
    if (decoded.kind !== 'event') {
      throw new Error('expected an event envelope');
    }

    expect(decoded.name).toBe('turn.plan');
  });

  it('rejects invalid envelopes', () => {
    expect(() =>
      decodeEnvelope({
        protocolVersion: PROTOCOL_VERSION,
        kind: 'event',
        id: 'evt-2',
        timestamp: new Date().toISOString(),
        payload: {},
      }),
    ).toThrow(/Invalid protocol envelope/);
  });
});
