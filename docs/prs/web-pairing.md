# PR: Web pairing

## Title

`feat: add in-app web pairing flow`

## Summary

- add Next.js proxy routes for pairing start, pairing confirm, and host session disconnect
- persist host URL and access token in secure cookies for server-rendered live transport
- add a home-screen connect panel so the web shell can pair without manual env var setup

## Files Changed

- `apps/web/app/api/host/*`
- `apps/web/app/connect-panel.tsx`
- `apps/web/app/host-session.ts`
- `apps/web/app/live-data.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/screens.tsx`
- `README.md`
- `docs/install.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.2.0.md`

## Test Evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / Follow-ups

- pairing currently assumes the web app can reach the host gateway directly from the browser session
- cookie persistence is intentionally local-app scoped; multi-device and token rotation UX still need follow-up work
