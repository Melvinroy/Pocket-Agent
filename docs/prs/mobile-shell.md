# PR: Mobile-first PWA shell

## Title

`feat: add mobile-first workspace and thread shell`

## Summary

- replace the placeholder landing page with a host-aware PWA dashboard
- add workspace and thread detail routes with reconnect, presence, and composer states
- expand shared UI primitives and route-level browser coverage for the new mobile shell

## Files Changed

- `apps/web/app/*`
- `packages/ui/src/index.tsx`
- `packages/ui/tests/ui.test.tsx`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/0.5.0.md`

## Test Evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

## Risks / Follow-ups

- route data is still seeded statically and needs to be replaced by authenticated host transport calls
- composer remains a host-routed preview until timeline and approval transport lands
