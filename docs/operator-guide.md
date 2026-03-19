# Operator Guide

## Default posture

- Bind the host gateway to `localhost` by default.
- Keep approvals on request.
- Keep network access disabled unless a task explicitly requires it.
- Treat one paired controller device as active; leave additional devices view-only.

## Normal operation

1. Start `apps/hostd`.
2. Verify health and bridge capabilities.
3. Pair the current controller device.
4. Resume or create a thread from the remote shell.
5. Use worktree binding and terminal presets instead of ad hoc host shell access.

## Recovery

- If the host restarts, use replayed thread events and persisted approvals to recover state.
- Revoke stale device tokens if ownership or device control is unclear.
- Re-check the active controller lease before approving actions or running presets.
