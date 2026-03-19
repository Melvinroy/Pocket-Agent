'use client';

import React from 'react';
import { useEffect, useState } from 'react';

import { StatusPill } from '@pocket-agent/ui';

import { subscribeToHostTransport } from './host-transport';
import type { CommandLogView, TransportConfig } from './live-data';

interface LiveCommandConsoleProps {
  threadId: string;
  initialLogs: CommandLogView[];
  transport: TransportConfig;
}

function commandTone(exitCode: number) {
  return exitCode === 0 ? 'success' : 'danger';
}

function mapCommandLog(
  threadId: string,
  entry: {
    sequence: number;
    createdAt: string;
    payload: Record<string, unknown>;
  },
): CommandLogView | null {
  if (
    entry.payload.preset !== 'lint' &&
    entry.payload.preset !== 'test' &&
    entry.payload.preset !== 'build'
  ) {
    return null;
  }

  return {
    id: `${threadId}:${entry.sequence}`,
    threadId,
    preset: entry.payload.preset,
    cwd:
      typeof entry.payload.cwd === 'string' && entry.payload.cwd
        ? entry.payload.cwd
        : 'bound workspace',
    exitCode:
      typeof entry.payload.exitCode === 'number' ? entry.payload.exitCode : 1,
    stdout:
      typeof entry.payload.stdout === 'string' ? entry.payload.stdout : '',
    stderr:
      typeof entry.payload.stderr === 'string' ? entry.payload.stderr : '',
    createdAt: entry.createdAt,
  };
}

export function LiveCommandConsole({
  threadId,
  initialLogs,
  transport,
}: LiveCommandConsoleProps) {
  const [logs, setLogs] = useState(initialLogs);

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

        if (
          event.type !== 'timeline.event' ||
          event.threadId !== threadId ||
          event.entry.name !== 'turn.output'
        ) {
          return;
        }

        const nextLog = mapCommandLog(threadId, event.entry);

        if (!nextLog) {
          return;
        }

        setLogs((current) => [...current, nextLog].slice(-10));
      },
    });
  }, [
    threadId,
    transport.accessToken,
    transport.enabled,
    transport.websocketUrl,
  ]);

  if (logs.length === 0) {
    return (
      <div style={{ fontSize: 13, color: '#6a746f' }}>
        No host command output has been captured for this thread yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {logs.map((log) => (
        <div
          key={log.id}
          style={{
            display: 'grid',
            gap: 10,
            padding: 14,
            borderRadius: 18,
            border: '1px solid rgba(20, 43, 40, 0.12)',
            background: '#f7f3ea',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontWeight: 700, color: '#142b28' }}>
              {log.preset} | exit {log.exitCode}
            </div>
            <StatusPill tone={commandTone(log.exitCode)}>
              {log.createdAt}
            </StatusPill>
          </div>
          <div style={{ fontSize: 13, color: '#35514b' }}>{log.cwd}</div>
          {log.stdout ? (
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                padding: 12,
                borderRadius: 14,
                background: '#fffdf8',
                color: '#142b28',
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              {log.stdout}
            </pre>
          ) : null}
          {log.stderr ? (
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                padding: 12,
                borderRadius: 14,
                background: '#fff1ee',
                color: '#8c2f22',
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              {log.stderr}
            </pre>
          ) : null}
        </div>
      ))}
    </div>
  );
}
