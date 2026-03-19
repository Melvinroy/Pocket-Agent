'use client';

import React from 'react';

import { StatusPill } from '@pocket-agent/ui';

import type { TransportConfig } from './live-data';
import { useHostTransportStatus } from './use-host-transport-status';

interface LiveTransportStatusProps {
  compact?: boolean;
  showReconnect?: boolean;
  transport: TransportConfig;
}

function toneForState(state: string) {
  if (state === 'live') {
    return 'success';
  }

  if (state === 'stale' || state === 'reconnecting' || state === 'connecting') {
    return 'warning';
  }

  return 'danger';
}

function summarizeTransport(transport: TransportConfig) {
  if (!transport.websocketUrl) {
    return 'host unavailable';
  }

  try {
    const url = new URL(transport.websocketUrl);
    return url.host;
  } catch {
    return transport.websocketUrl;
  }
}

export function LiveTransportStatus({
  compact = false,
  showReconnect = true,
  transport,
}: LiveTransportStatusProps) {
  const { reconnect, status } = useHostTransportStatus(transport);

  if (!transport.enabled) {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <StatusPill tone="neutral">seeded mode</StatusPill>
      </div>
    );
  }

  const summary = summarizeTransport(transport);
  const detail =
    status.state === 'live'
      ? status.lastHeartbeatAt
        ? `heartbeat ${status.lastHeartbeatAt}`
        : 'connected'
      : status.state === 'reconnecting'
        ? `retry ${status.reconnectAttempt} in ${status.reconnectInMs ?? 0}ms`
        : status.state === 'stale'
          ? 'connection idle, waiting for host heartbeat'
          : (status.error ?? 'host transport recovering');

  return (
    <div
      style={{
        display: 'grid',
        gap: compact ? 6 : 10,
        padding: compact ? 0 : 14,
        borderRadius: compact ? 0 : 16,
        border: compact ? 'none' : '1px solid rgba(20, 43, 40, 0.12)',
        background: compact ? 'transparent' : '#fffaf0',
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
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={{ fontWeight: 700, color: '#142b28' }}>
            Host transport
          </div>
          {!compact ? (
            <div style={{ fontSize: 13, color: '#35514b' }}>{summary}</div>
          ) : null}
        </div>
        <StatusPill tone={toneForState(status.state)}>
          {status.state}
        </StatusPill>
      </div>
      <div style={{ fontSize: 13, color: '#6a746f' }}>{detail}</div>
      {showReconnect ? (
        <div>
          <button
            type="button"
            onClick={reconnect}
            style={{
              minHeight: 40,
              borderRadius: 999,
              border: 'none',
              padding: '0 14px',
              font: 'inherit',
              fontWeight: 700,
              cursor: 'pointer',
              background: '#142b28',
              color: '#f6f2e8',
            }}
          >
            Reconnect host link
          </button>
        </div>
      ) : null}
    </div>
  );
}
