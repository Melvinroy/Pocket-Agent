import { describe, expect, it } from 'vitest';

import {
  PROTOCOL_VERSION,
  approvalDecisionSchema,
  createEventEnvelope,
  createRequestEnvelope,
  decodeEnvelope,
  reviewQueueItemSchema,
  timelineEntrySchema,
  transportClientMessageSchema,
  transportServerMessageSchema,
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

  it('validates timeline and approval payload helpers', () => {
    const timelineEntry = timelineEntrySchema.parse({
      sequence: 2,
      name: 'approval.resolved',
      createdAt: new Date().toISOString(),
      payload: {
        approvalId: 'approval-1',
        decision: 'approved',
      },
    });

    expect(timelineEntry.name).toBe('approval.resolved');
    expect(approvalDecisionSchema.parse('approved')).toBe('approved');
  });

  it('validates review websocket transport messages', () => {
    expect(
      transportClientMessageSchema.parse({
        action: 'subscribe-reviews',
      }).action,
    ).toBe('subscribe-reviews');

    const item = reviewQueueItemSchema.parse({
      id: 'review-1',
      workspaceId: 'workspace-1',
      threadId: 'thread-1',
      title: 'Review thread',
      status: 'active',
      summary: 'Review is active',
      updatedAt: '2 min ago',
    });

    const serverMessage = transportServerMessageSchema.parse({
      type: 'reviews.snapshot',
      items: [item],
    });

    expect(serverMessage.type).toBe('reviews.snapshot');
  });
});
