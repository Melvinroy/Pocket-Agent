'use client';

import React from 'react';
import { useState, useTransition } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';

import { StatusPill } from '@pocket-agent/ui';

import type { ApprovalSummary } from './mock-data';

interface ThreadActionsProps {
  threadId: string;
  approvals: ApprovalSummary[];
  enabled: boolean;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export function ThreadActions({
  threadId,
  approvals,
  enabled,
}: ThreadActionsProps) {
  const router = useRouter();
  const [instruction, setInstruction] = useState('');
  const [interruptReason, setInterruptReason] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pendingApprovals = approvals.filter(
    (approval) => approval.status === 'pending',
  );

  const submitAction = (action: () => Promise<void>) => {
    setError(null);
    setStatus(null);

    startTransition(() => {
      void action()
        .then(() => {
          router.refresh();
        })
        .catch((actionError: unknown) => {
          setError(
            actionError instanceof Error
              ? actionError.message
              : 'Unable to complete controller action',
          );
        });
    });
  };

  const disabled = !enabled || isPending;

  return (
    <div
      style={{
        display: 'grid',
        gap: 16,
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: 10,
          padding: 14,
          borderRadius: 18,
          border: '1px solid rgba(20, 43, 40, 0.12)',
          background: '#fffaf0',
        }}
      >
        <label
          htmlFor="steer-instruction"
          style={{ fontSize: 13, fontWeight: 700, color: '#142b28' }}
        >
          Steer the next turn
        </label>
        <textarea
          id="steer-instruction"
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          disabled={disabled}
          placeholder="Ask the host to continue the milestone, explain a diff, or revise the plan."
          rows={4}
          style={{
            width: '100%',
            borderRadius: 14,
            border: '1px solid rgba(20, 43, 40, 0.16)',
            padding: 12,
            font: 'inherit',
            resize: 'vertical',
            background: disabled ? '#f2ede2' : '#fffdf8',
            color: '#142b28',
          }}
        />
        <button
          type="button"
          disabled={disabled || !instruction.trim()}
          onClick={() =>
            submitAction(async () => {
              const response = await fetch(
                `/api/host/threads/${threadId}/steer`,
                {
                  method: 'POST',
                  headers: {
                    'content-type': 'application/json',
                  },
                  body: JSON.stringify({
                    instruction,
                  }),
                },
              );

              if (!response.ok) {
                throw new Error(await readErrorMessage(response));
              }

              setInstruction('');
              setStatus('Steer request accepted by the host');
            })
          }
          style={buttonStyle(disabled || !instruction.trim(), true)}
        >
          Send steer request
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 10,
          padding: 14,
          borderRadius: 18,
          border: '1px solid rgba(20, 43, 40, 0.12)',
          background: '#f7f3ea',
        }}
      >
        <label
          htmlFor="interrupt-reason"
          style={{ fontSize: 13, fontWeight: 700, color: '#142b28' }}
        >
          Interrupt safely
        </label>
        <input
          id="interrupt-reason"
          value={interruptReason}
          onChange={(event) => setInterruptReason(event.target.value)}
          disabled={disabled}
          placeholder="Optional reason for the interruption"
          style={inputStyle(disabled)}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            submitAction(async () => {
              const response = await fetch(
                `/api/host/threads/${threadId}/interrupt`,
                {
                  method: 'POST',
                  headers: {
                    'content-type': 'application/json',
                  },
                  body: JSON.stringify({
                    reason: interruptReason,
                  }),
                },
              );

              if (!response.ok) {
                throw new Error(await readErrorMessage(response));
              }

              setInterruptReason('');
              setStatus('Interrupt request accepted by the host');
            })
          }
          style={buttonStyle(disabled, false)}
        >
          Interrupt thread
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 10,
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
          <div style={{ fontSize: 13, fontWeight: 700, color: '#142b28' }}>
            Approval queue
          </div>
          <StatusPill
            tone={pendingApprovals.length > 0 ? 'warning' : 'neutral'}
          >
            {pendingApprovals.length > 0
              ? `${pendingApprovals.length} pending`
              : 'No pending approvals'}
          </StatusPill>
        </div>
        {pendingApprovals.map((approval) => (
          <div
            key={approval.id}
            style={{
              display: 'grid',
              gap: 8,
              padding: 12,
              borderRadius: 14,
              background: '#fffdf8',
              border: '1px solid rgba(20, 43, 40, 0.08)',
            }}
          >
            <div style={{ fontWeight: 700, color: '#142b28' }}>
              {approval.title}
            </div>
            <div style={{ fontSize: 13, color: '#35514b' }}>
              {approval.summary}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  submitAction(async () => {
                    const response = await fetch(
                      `/api/host/approvals/${approval.id}/resolve`,
                      {
                        method: 'POST',
                        headers: {
                          'content-type': 'application/json',
                        },
                        body: JSON.stringify({
                          decision: 'approved',
                        }),
                      },
                    );

                    if (!response.ok) {
                      throw new Error(await readErrorMessage(response));
                    }

                    setStatus(`Approved ${approval.title}`);
                  })
                }
                style={buttonStyle(disabled, true)}
              >
                Approve
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  submitAction(async () => {
                    const response = await fetch(
                      `/api/host/approvals/${approval.id}/resolve`,
                      {
                        method: 'POST',
                        headers: {
                          'content-type': 'application/json',
                        },
                        body: JSON.stringify({
                          decision: 'rejected',
                        }),
                      },
                    );

                    if (!response.ok) {
                      throw new Error(await readErrorMessage(response));
                    }

                    setStatus(`Rejected ${approval.title}`);
                  })
                }
                style={buttonStyle(disabled, false)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {!enabled ? (
        <div style={{ fontSize: 13, color: '#6a746f' }}>
          Pair as the active controller to enable host-routed actions.
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

function inputStyle(disabled: boolean) {
  return {
    width: '100%',
    minHeight: 44,
    borderRadius: 14,
    border: '1px solid rgba(20, 43, 40, 0.16)',
    padding: '0 12px',
    font: 'inherit',
    background: disabled ? '#f2ede2' : '#fffdf8',
    color: '#142b28',
  } satisfies CSSProperties;
}

function buttonStyle(disabled: boolean, accent: boolean) {
  return {
    minHeight: 44,
    borderRadius: 999,
    border: 'none',
    padding: '0 16px',
    font: 'inherit',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#d7d1c4' : accent ? '#142b28' : '#b74b3b',
    color: '#f6f2e8',
    opacity: disabled ? 0.7 : 1,
  } satisfies CSSProperties;
}
