# PR: Live review stream

## Title

`feat: add websocket-backed live review stream`

## Summary

- add typed review subscription messages to the remote protocol
- broadcast live review snapshots from the host gateway
- replace static review-history rendering with a websocket-aware client panel
- add host, protocol, and browser coverage for live review updates

## Files changed

- `packages/remote-protocol/src/index.ts`
- `packages/remote-protocol/tests/protocol.test.ts`
- `apps/hostd/src/lib/gateway.ts`
- `apps/hostd/tests/gateway.test.ts`
- `apps/web/app/live-review-queue.tsx`
- `apps/web/app/live-review-queue.test.tsx`
- `apps/web/app/screens.tsx`
- `apps/web/app/reviews/page.tsx`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.11.0.md`

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / follow-ups

- The host currently broadcasts full review snapshots instead of deltas; if review volume grows, incremental updates will be cheaper.
- The `/reviews` page still opens one websocket per view; shared transport reuse across pages is a follow-on optimization.
