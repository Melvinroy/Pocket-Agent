# PR: Web command console

## Title

`feat: add live command console to thread shell`

## Summary

- add replay-backed command log extraction for thread views
- add a websocket-aware command console to the thread screen
- keep preset output visible inline instead of relying only on timeline summaries
- add browser coverage for seeded and live command output rendering

## Files changed

- `apps/web/app/mock-data.ts`
- `apps/web/app/live-data.ts`
- `apps/web/app/live-command-console.tsx`
- `apps/web/app/live-command-console.test.tsx`
- `apps/web/app/screens.tsx`
- `apps/web/app/workspaces/[workspaceId]/threads/[threadId]/page.tsx`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.5.0.md`

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / follow-ups

- The command console still focuses on preset output; richer arbitrary command session streaming remains a follow-on slice.
- The web shell still renders command logs as a recent list rather than a multiplexed terminal transcript.
