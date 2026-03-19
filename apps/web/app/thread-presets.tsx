'use client';

import React from 'react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { StatusPill } from '@pocket-agent/ui';

import type { TerminalPresetSummary } from './mock-data';

interface ThreadPresetsProps {
  threadId: string;
  presets: TerminalPresetSummary[];
  enabled: boolean;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? 'Unable to run host preset';
  } catch {
    return 'Unable to run host preset';
  }
}

function presetTone(status: TerminalPresetSummary['status']) {
  if (status === 'last-run') {
    return 'success';
  }

  if (status === 'ready') {
    return 'warning';
  }

  return 'neutral';
}

export function ThreadPresets({
  threadId,
  presets,
  enabled,
}: ThreadPresetsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingPreset, setPendingPreset] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {presets.map((preset) => {
        const disabled = !enabled || isPending;
        const running = pendingPreset === preset.preset && isPending;

        return (
          <div
            key={preset.id}
            style={{
              display: 'grid',
              gap: 8,
              padding: 14,
              borderRadius: 18,
              border: '1px solid rgba(20, 43, 40, 0.12)',
              background: '#f6f2e8',
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
                {preset.preset}
              </div>
              <StatusPill tone={presetTone(preset.status)}>
                {preset.status}
              </StatusPill>
            </div>
            <div style={{ fontSize: 13, color: '#35514b' }}>{preset.cwd}</div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setStatus(null);
                setError(null);
                setPendingPreset(preset.preset);

                startTransition(() => {
                  void fetch(`/api/host/threads/${threadId}/commands/preset`, {
                    method: 'POST',
                    headers: {
                      'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                      preset: preset.preset,
                    }),
                  })
                    .then(async (response) => {
                      if (!response.ok) {
                        throw new Error(await readErrorMessage(response));
                      }

                      setStatus(
                        `${preset.preset} preset completed on the host`,
                      );
                      router.refresh();
                    })
                    .catch((presetError: unknown) => {
                      setError(
                        presetError instanceof Error
                          ? presetError.message
                          : 'Unable to run host preset',
                      );
                    })
                    .finally(() => {
                      setPendingPreset(null);
                    });
                });
              }}
              style={{
                minHeight: 44,
                borderRadius: 999,
                border: 'none',
                padding: '0 16px',
                font: 'inherit',
                fontWeight: 700,
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: disabled ? '#d7d1c4' : '#142b28',
                color: '#f6f2e8',
                opacity: disabled ? 0.7 : 1,
              }}
            >
              {running ? `Running ${preset.preset}...` : `Run ${preset.preset}`}
            </button>
          </div>
        );
      })}
      {!enabled ? (
        <div style={{ fontSize: 13, color: '#6a746f' }}>
          Pair as the active controller to run host terminal presets.
        </div>
      ) : null}
      {status ? (
        <div style={{ fontSize: 13, color: '#1f6a5b' }}>{status}</div>
      ) : null}
      {error ? (
        <div style={{ fontSize: 13, color: '#9f2d2d' }}>{error}</div>
      ) : null}
    </div>
  );
}
