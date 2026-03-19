'use client';

import React from 'react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { StatusPill } from '@pocket-agent/ui';

interface FileEditorProps {
  workspaceId: string;
  path: string;
  initialContents: string;
  editable: boolean;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? 'Unable to save file';
  } catch {
    return 'Unable to save file';
  }
}

export function FileEditor({
  workspaceId,
  path,
  initialContents,
  editable,
}: FileEditorProps) {
  const router = useRouter();
  const [contents, setContents] = useState(initialContents);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontWeight: 700, color: '#142b28' }}>{path}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <StatusPill tone={editable ? 'success' : 'neutral'}>
            {editable ? 'controller write' : 'read only'}
          </StatusPill>
          <StatusPill tone="neutral">host-routed</StatusPill>
        </div>
      </div>
      <textarea
        value={contents}
        onChange={(event) => setContents(event.target.value)}
        readOnly={!editable || isPending}
        rows={20}
        style={{
          width: '100%',
          borderRadius: 18,
          border: '1px solid rgba(20, 43, 40, 0.16)',
          padding: 14,
          fontFamily: "'Cascadia Code', 'SFMono-Regular', Consolas, monospace",
          fontSize: 13,
          lineHeight: 1.5,
          background: editable ? '#fffdf8' : '#f2ede2',
          color: '#142b28',
          resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={!editable || isPending || contents === initialContents}
          onClick={() => {
            setStatus(null);
            setError(null);

            startTransition(() => {
              void fetch(`/api/host/workspaces/${workspaceId}/file`, {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                },
                body: JSON.stringify({
                  path,
                  contents,
                }),
              })
                .then(async (response) => {
                  if (!response.ok) {
                    throw new Error(await readErrorMessage(response));
                  }

                  setStatus('Saved to host workspace');
                  router.refresh();
                })
                .catch((saveError: unknown) => {
                  setError(
                    saveError instanceof Error
                      ? saveError.message
                      : 'Unable to save file',
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
            cursor:
              !editable || isPending || contents === initialContents
                ? 'not-allowed'
                : 'pointer',
            background:
              !editable || isPending || contents === initialContents
                ? '#d7d1c4'
                : '#142b28',
            color: '#f6f2e8',
            opacity:
              !editable || isPending || contents === initialContents ? 0.7 : 1,
          }}
        >
          {isPending ? 'Saving...' : 'Save file'}
        </button>
      </div>
      {status ? (
        <div style={{ fontSize: 13, color: '#1f6a5b' }}>{status}</div>
      ) : null}
      {error ? (
        <div style={{ fontSize: 13, color: '#9f2d2d' }}>{error}</div>
      ) : null}
    </div>
  );
}
