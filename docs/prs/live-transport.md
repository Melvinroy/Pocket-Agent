# PR: Live transport

## Title

`feat: add live transport discovery and websocket timeline streaming`

## Summary

- add host endpoints for workspace and thread discovery
- add websocket timeline subscriptions on the host gateway
- wire the web shell to live host data with seeded fallback
- add a host `--serve` mode for local transport bring-up

## Files Changed

- `apps/hostd/src/index.ts`
- `apps/hostd/src/lib/gateway.ts`
- `apps/hostd/tests/gateway.test.ts`
- `apps/web/app/*`
- `packages/remote-protocol/src/index.ts`
- `README.md`
- `docs/install.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.1.0.md`

## Test Evidence

- `corepack pnpm install`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / Follow-ups

- websocket transport currently streams timeline events only; richer presence and command-output multiplexing can build on the same channel next
- live web access currently relies on host URL and token environment variables rather than an in-app pairing UX
