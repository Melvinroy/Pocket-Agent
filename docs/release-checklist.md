# Release Checklist

- Update `VERSION`, `CHANGELOG.md`, and `docs/releases/<version>.md`.
- Confirm package versions are aligned across the monorepo.
- Run `corepack pnpm lint`.
- Run `corepack pnpm typecheck`.
- Run `corepack pnpm test`.
- Run `corepack pnpm build`.
- Verify install and operator docs still match current behavior.
- Re-check compatibility assumptions against the current host/runtime setup.
- Confirm no secrets appear in logs, fixtures, screenshots, or release notes.
