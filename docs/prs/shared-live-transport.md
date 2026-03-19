# PR: Shared live transport

## Title

`feat: share websocket transport across live web views`

## Summary

- add a shared browser transport client for host websocket sessions
- deduplicate thread and review subscriptions across concurrent live views
- refactor the timeline, command console, and review queue to use the shared transport
- add browser coverage for socket reuse across thread views

## Files changed

- `apps/web/app/host-transport.ts`
- `apps/web/app/host-transport.test.tsx`
- `apps/web/app/live-timeline.tsx`
- `apps/web/app/live-command-console.tsx`
- `apps/web/app/live-command-console.test.tsx`
- `apps/web/app/live-review-queue.tsx`
- `apps/web/app/live-review-queue.test.tsx`
- `VERSION`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.12.0.md`

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / follow-ups

- The shared transport currently retains one socket per host session in a single browser tab; cross-tab reuse is still out of scope.
- Reconnect and backoff behavior is still basic and should be hardened before broad public usage.
