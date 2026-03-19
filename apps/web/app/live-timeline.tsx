'use client';

import React from 'react';
import { useEffect, useState } from 'react';

import { TimelinePreview } from '@pocket-agent/ui';

import { subscribeToHostTransport } from './host-transport';
import type { TimelineEntry } from './mock-data';

interface LiveTimelineProps {
  threadId: string;
  initialItems: TimelineEntry[];
  transport: {
    enabled: boolean;
    websocketUrl: string | null;
    accessToken: string | null;
  };
}

function summarizePayload(payload: Record<string, unknown>): string {
  if (typeof payload.summary === 'string' && payload.summary) {
    return payload.summary;
  }

  if (typeof payload.chunk === 'string' && payload.chunk) {
    return payload.chunk;
  }

  if (typeof payload.instruction === 'string' && payload.instruction) {
    return payload.instruction;
  }

  if (typeof payload.reason === 'string' && payload.reason) {
    return payload.reason;
  }

  return 'Host event';
}

export function LiveTimeline({
  threadId,
  initialItems,
  transport,
}: LiveTimelineProps) {
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    if (
      !transport.enabled ||
      !transport.websocketUrl ||
      !transport.accessToken
    ) {
      return;
    }

    return subscribeToHostTransport({
      websocketUrl: transport.websocketUrl,
      accessToken: transport.accessToken,
      threadId,
      listener: (payload) => {
        const event = payload as
          | {
              type: 'ready' | 'subscribed';
            }
          | {
              type: 'timeline.event';
              threadId: string;
              entry: {
                sequence: number;
                name: string;
                createdAt: string;
                payload: Record<string, unknown>;
              };
            };

        if (event.type !== 'timeline.event' || event.threadId !== threadId) {
          return;
        }

        setItems((current) => {
          const nextEntry: TimelineEntry = {
            id: `${threadId}:${event.entry.sequence}`,
            threadId,
            title: event.entry.name,
            status: event.entry.name,
            summary: summarizePayload(event.entry.payload),
            meta: event.entry.createdAt,
          };

          return [...current, nextEntry].slice(-20);
        });
      },
    });
  }, [
    threadId,
    transport.accessToken,
    transport.enabled,
    transport.websocketUrl,
  ]);

  return <TimelinePreview items={items} />;
}
