'use client';

import React, { useState, useTransition } from 'react';

import { StatusPill } from '@pocket-agent/ui';

interface PairingPayload {
  pairingSession: {
    id: string;
    confirmationCode: string;
  };
}

function formatPairingError(error: string | null | undefined) {
  if (!error) {
    return 'Unable to complete pairing';
  }

  if (error.includes('active lease')) {
    return 'Another controller is already paired. Disconnect that device or revoke its token before retrying.';
  }

  return error;
}

export function ConnectPanel({ connected }: { connected: boolean }) {
  const [hostUrl, setHostUrl] = useState('http://127.0.0.1:43110');
  const [displayName, setDisplayName] = useState('Pocket Agent Web');
  const [pairing, setPairing] = useState<PairingPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const startPairing = () => {
    startTransition(async () => {
      setError(null);
      const response = await fetch('/api/host/pairing/start', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hostUrl,
          role: 'controller',
        }),
      });
      const payload = (await response.json()) as
        | PairingPayload
        | { error?: string };

      if (!response.ok || !('pairingSession' in payload)) {
        setPairing(null);
        setError(
          formatPairingError(
            'error' in payload
              ? (payload.error ?? 'Unable to start pairing')
              : 'Unable to start pairing',
          ),
        );
        return;
      }

      setPairing(payload);
    });
  };

  const confirmPairing = () => {
    if (!pairing) {
      return;
    }

    startTransition(async () => {
      setError(null);
      const response = await fetch('/api/host/pairing/confirm', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hostUrl,
          pairingId: pairing.pairingSession.id,
          confirmationCode: pairing.pairingSession.confirmationCode,
          displayName,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(
          formatPairingError(payload.error ?? 'Unable to confirm pairing'),
        );
        return;
      }

      window.location.reload();
    });
  };

  const disconnect = () => {
    startTransition(async () => {
      await fetch('/api/host/session', {
        method: 'DELETE',
      });
      setPairing(null);
      setError(null);
      window.location.reload();
    });
  };

  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
      }}
    >
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Host URL</span>
        <input
          value={hostUrl}
          onChange={(event) => setHostUrl(event.target.value)}
          disabled={connected || isPending}
          style={{
            minHeight: 44,
            borderRadius: 14,
            border: '1px solid rgba(28, 28, 34, 0.12)',
            padding: '0 12px',
            font: 'inherit',
          }}
        />
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Device name</span>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          disabled={connected || isPending}
          style={{
            minHeight: 44,
            borderRadius: 14,
            border: '1px solid rgba(28, 28, 34, 0.12)',
            padding: '0 12px',
            font: 'inherit',
          }}
        />
      </label>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatusPill tone={connected ? 'success' : 'warning'}>
          {connected ? 'Connected' : 'Not paired'}
        </StatusPill>
        {pairing ? (
          <StatusPill tone="neutral">
            Code {pairing.pairingSession.confirmationCode}
          </StatusPill>
        ) : null}
      </div>

      {error ? (
        <p style={{ margin: 0, color: '#9f1d1d', fontWeight: 700 }}>{error}</p>
      ) : null}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {connected ? (
          <button
            type="button"
            onClick={disconnect}
            disabled={isPending}
            style={buttonStyle(false)}
          >
            Disconnect
          </button>
        ) : pairing ? (
          <button
            type="button"
            onClick={confirmPairing}
            disabled={isPending}
            style={buttonStyle(true)}
          >
            Confirm pairing
          </button>
        ) : (
          <button
            type="button"
            onClick={startPairing}
            disabled={isPending}
            style={buttonStyle(true)}
          >
            Start pairing
          </button>
        )}
      </div>
    </div>
  );
}

function buttonStyle(accent: boolean) {
  return {
    minHeight: 44,
    borderRadius: 999,
    border: 'none',
    padding: '0 18px',
    background: accent ? '#142b28' : 'rgba(42, 47, 43, 0.08)',
    color: accent ? '#f6f2e8' : '#2f3a31',
    fontWeight: 700,
    font: 'inherit',
    cursor: 'pointer',
  } satisfies React.CSSProperties;
}
