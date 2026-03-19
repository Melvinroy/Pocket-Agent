# PR: Web review history

## Title

`feat: add dedicated review history route`

## Summary

- add a full-screen `/reviews` route for cross-workspace review work
- add review posture stats and thread deep links
- reuse the host-backed review queue projection from the dashboard
- add browser coverage for the review history route

## Files changed

- `apps/web/app/live-data.ts`
- `apps/web/app/screens.tsx`
- `apps/web/app/reviews/page.tsx`
- `apps/web/app/reviews/page.test.tsx`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.9.0.md`

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / follow-ups

- Review history still reflects the current queue projection instead of a durable server-side review log with pagination.
- The route does not yet support filtering by workspace or review state; that becomes relevant once review volume grows.
