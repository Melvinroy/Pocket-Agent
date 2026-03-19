# PR: Terminal and worktrees

## Title

`feat: add host-side terminal presets and worktree binding`

## Summary

- add workspace worktree discovery and binding helpers
- expose authenticated worktree and terminal preset routes on the host gateway
- surface bound worktree and preset execution context in the remote shell

## Files Changed

- `apps/hostd/src/index.ts`
- `apps/hostd/src/lib/gateway.ts`
- `apps/hostd/tests/gateway.test.ts`
- `apps/web/app/*`
- `packages/workspace-manager/src/index.ts`
- `packages/workspace-manager/tests/workspace-manager.test.ts`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/0.8.0.md`

## Test Evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

## Risks / Follow-ups

- terminal execution currently uses preset commands only; arbitrary command streaming remains future work
- worktree binding is persisted as thread event state and should be promoted into richer workspace coordination later
