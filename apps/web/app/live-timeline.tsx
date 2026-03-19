'use client';

import React from 'react';
import { useEffect, useState } from 'react';

import { TimelinePreview } from '@pocket-agent/ui';

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

    const url = new URL(transport.websocketUrl);
    url.searchParams.set('accessToken', transport.accessToken);

    const socket = new WebSocket(url);

    socket.addEventListener('open', () => {
      socket.send(
        JSON.stringify({
          action: 'subscribe',
          threadId,
        }),
      );
    });

    socket.addEventListener('message', (message) => {
      const payload = JSON.parse(message.data as string) as
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

      if (payload.type !== 'timeline.event' || payload.threadId !== threadId) {
        return;
      }

      setItems((current) => {
        const nextEntry: TimelineEntry = {
          id: `${threadId}:${payload.entry.sequence}`,
          threadId,
          title: payload.entry.name,
          status: payload.entry.name,
          summary: summarizePayload(payload.entry.payload),
          meta: payload.entry.createdAt,
        };

        return [...current, nextEntry].slice(-20);
      });
    });

    return () => {
      socket.close();
    };
  }, [
    threadId,
    transport.accessToken,
    transport.enabled,
    transport.websocketUrl,
  ]);

  return <TimelinePreview items={items} />;
}
