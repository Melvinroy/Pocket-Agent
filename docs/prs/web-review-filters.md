# PR: Web review filters

## Title

`feat: add filters to review history route`

## Summary

- add state filters for pending, active, and recent review work
- add workspace filters for cross-workspace queue narrowing
- keep filters in route query params so links remain shareable
- add browser coverage for state-filtered review history

## Files changed

- `apps/web/app/screens.tsx`
- `apps/web/app/reviews/page.tsx`
- `apps/web/app/reviews/page.test.tsx`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.10.0.md`

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / follow-ups

- Review filters currently handle simple single-value query params; richer combinations or search will need a stronger typed filter model.
- Workspace filters are derived from the current queue payload, not a broader host workspace directory.
