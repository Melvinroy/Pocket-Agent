# PR: E2E dogfood

## Title

`fix: resolve first live dogfood regressions in web shell`

## Summary

- dogfood the real local-host pairing and dashboard flow through the Next.js web shell
- fix the shared phone-shell hero width regression exposed by the live dashboard
- surface actionable controller-lease conflict guidance in the Connect Panel
- add regression coverage for both fixes

## Files changed

- `packages/ui/src/index.tsx`
- `packages/ui/tests/ui.test.tsx`
- `apps/web/app/connect-panel.tsx`
- `apps/web/app/connect-panel.test.tsx`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.14.0.md`

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / follow-ups

- The Playwright MCP browser is currently blocked by a local Chrome profile collision, so this dogfood pass used live HTTP flows rather than interactive browser control.
- The Connect Panel still only supports controller pairing; viewer-first pairing remains a follow-up product flow.
