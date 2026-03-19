# PR Summary: scaffold-monorepo

## Title

`chore: scaffold monorepo and repo standards`

## Summary

Bootstraps the Codex Remote monorepo, adds the initial host and web app skeletons, establishes typed package boundaries, and introduces repo standards for CI, versioning, ADRs, changelog, release notes, and progress tracking.

## Files changed

- Root monorepo and toolchain config
- `apps/hostd`
- `apps/web`
- `packages/*`
- `docs/*`
- `.github/workflows/ci.yml`

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

## Risks / follow-ups

- Codex App Server integration remains behind a typed adapter skeleton until the next slice.
- Session-store package defines persistence contracts but not yet full schema migrations.
