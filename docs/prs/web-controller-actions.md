# PR: Web controller actions

## Title

`feat: add web controller actions for live threads`

## Summary

- add web-local proxy routes for steer, interrupt, and approval resolve actions
- replace the static thread control strip with a client action panel that posts through those routes
- add focused browser tests for controller actions
- fix stdio bridge chunk handling so the shared test suite stays green

## Files changed

- `apps/web/app/api/host/proxy.ts`
- `apps/web/app/api/host/threads/[threadId]/steer/route.ts`
- `apps/web/app/api/host/threads/[threadId]/interrupt/route.ts`
- `apps/web/app/api/host/approvals/[approvalId]/resolve/route.ts`
- `apps/web/app/thread-actions.tsx`
- `apps/web/app/thread-actions.test.tsx`
- `apps/web/app/screens.tsx`
- `packages/codex-bridge/src/index.ts`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.3.0.md`

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / follow-ups

- The web shell still refreshes the route after each action instead of maintaining fully optimistic thread state.
- Approval and steer history still depend on timeline refresh rather than a richer command-response websocket multiplex.
