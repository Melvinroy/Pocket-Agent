# PR: Web review queue

## Title

`feat: add dashboard review queue across workspaces`

## Summary

- add seeded and live review queue projections for review-ready threads
- surface review and approval-gate items on the home screen
- deep link review queue items into their thread route
- add browser coverage for review queue rendering

## Files changed

- `apps/web/app/mock-data.ts`
- `apps/web/app/live-data.ts`
- `apps/web/app/screens.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/home-screen.test.tsx`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.8.0.md`

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / follow-ups

- The live review queue currently derives from thread summary state and pending approvals; a dedicated review-history endpoint would support richer filtering and retention.
- Queue ordering is only as fresh as the host thread summary refresh path, so a future websocket channel for review-list updates would remove the remaining poll gap.
