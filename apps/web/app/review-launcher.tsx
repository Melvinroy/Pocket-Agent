'use client';

import React from 'react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface ReviewLauncherProps {
  threadId: string;
  path: string;
  enabled: boolean;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? 'Unable to start review';
  } catch {
    return 'Unable to start review';
  }
}

export function ReviewLauncher({
  threadId,
  path,
  enabled,
}: ReviewLauncherProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <button
        type="button"
        disabled={!enabled || isPending}
        onClick={() => {
          setStatus(null);
          setError(null);

          startTransition(() => {
            void fetch(`/api/host/threads/${threadId}/review`, {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                path,
                summary: `Review ${path} after web edit`,
              }),
            })
              .then(async (response) => {
                if (!response.ok) {
                  throw new Error(await readErrorMessage(response));
                }

                setStatus('Review started on the host');
                router.refresh();
              })
              .catch((reviewError: unknown) => {
                setError(
                  reviewError instanceof Error
                    ? reviewError.message
                    : 'Unable to start review',
                );
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
          cursor: !enabled || isPending ? 'not-allowed' : 'pointer',
          background: !enabled || isPending ? '#d7d1c4' : '#b74b3b',
          color: '#f6f2e8',
          opacity: !enabled || isPending ? 0.7 : 1,
        }}
      >
        {isPending ? 'Starting review...' : 'Start host review'}
      </button>
      {status ? (
        <div style={{ fontSize: 13, color: '#1f6a5b' }}>{status}</div>
      ) : null}
      {error ? (
        <div style={{ fontSize: 13, color: '#9f2d2d' }}>{error}</div>
      ) : null}
    </div>
  );
}
