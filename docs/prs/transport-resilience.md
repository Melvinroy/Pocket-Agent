# PR: Transport resilience

## Title

`feat: harden live transport recovery and operator feedback`

## Summary

- add heartbeat messages to the host websocket transport
- detect stale and reconnecting transport state in the shared browser client
- replay thread and review subscriptions after reconnect
- surface live transport status and manual reconnect controls in the home, review, thread, and command-console flows
- block controller actions and terminal presets while the live link is degraded

## Files changed

- `apps/hostd/src/lib/gateway.ts`
- `apps/hostd/tests/gateway.test.ts`
- `apps/web/app/host-transport.ts`
- `apps/web/app/use-host-transport-status.ts`
- `apps/web/app/live-transport-status.tsx`
- `apps/web/app/live-command-console.tsx`
- `apps/web/app/live-review-queue.tsx`
- `apps/web/app/thread-actions.tsx`
- `apps/web/app/thread-presets.tsx`
- `apps/web/app/screens.tsx`
- `packages/remote-protocol/src/index.ts`
- `packages/remote-protocol/tests/protocol.test.ts`
- `README.md`
- `docs/operator-guide.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.13.0.md`

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / follow-ups

- The browser reconnect policy is per-tab and does not coordinate multiple tabs yet.
- Heartbeats currently use a fixed interval instead of adaptive liveness based on server load or page visibility.
