# PR: Timeline and approvals

## Title

`feat: add timeline streaming and approval controls`

## Summary

- add authenticated timeline retrieval over the host gateway
- add controller-only steer, interrupt, and approval resolution endpoints
- extend the mobile thread shell with approval sheets and control affordances

## Files Changed

- `apps/hostd/src/lib/gateway.ts`
- `apps/hostd/tests/gateway.test.ts`
- `apps/web/app/*`
- `packages/remote-protocol/src/index.ts`
- `packages/remote-protocol/tests/protocol.test.ts`
- `packages/session-store/src/index.ts`
- `packages/session-store/tests/session-store.test.ts`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/0.6.0.md`

## Test Evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

## Risks / Follow-ups

- the gateway currently returns timeline snapshots over HTTP rather than a persistent websocket transport
- approval resolution is host-authenticated but still uses seed data in the web shell pending live client transport wiring
