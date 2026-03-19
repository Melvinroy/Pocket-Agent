# PR: Viewer pairing fallback

## Title

`feat: add viewer pairing fallback in web connect panel`

## Summary

- add controller and viewer pairing mode selection to the web Connect Panel
- add a one-click fallback that retries pairing as a viewer when controller access is blocked
- update browser coverage for the new pairing labels and viewer fallback flow

## Files changed

- `apps/web/app/connect-panel.tsx`
- `apps/web/app/connect-panel.test.tsx`
- `apps/web/app/page.test.tsx`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.15.0.md`

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / follow-ups

- Viewer mode is currently only selected during pairing; the UI does not yet expose role switching after a session is already established.
- The host still enforces a single active controller, so viewer-mode shells remain read-only by design.
