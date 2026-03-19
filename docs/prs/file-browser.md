# PR: Files and review

## Title

`feat: add host-scoped file browser and review flow`

## Summary

- add workspace-safe file listing, read, and write helpers
- expose authenticated file and review routes on the host gateway
- surface changed files and review affordances in the mobile shell

## Files Changed

- `apps/hostd/src/lib/gateway.ts`
- `apps/hostd/tests/gateway.test.ts`
- `apps/web/app/*`
- `packages/session-store/src/index.ts`
- `packages/session-store/tests/session-store.test.ts`
- `packages/workspace-manager/src/index.ts`
- `packages/workspace-manager/tests/workspace-manager.test.ts`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/0.7.0.md`

## Test Evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

## Risks / Follow-ups

- file editing is intentionally light and still needs richer diff-aware save conflict handling
- review start currently emits a host event and audit record; deeper Codex review integration follows in later milestones
