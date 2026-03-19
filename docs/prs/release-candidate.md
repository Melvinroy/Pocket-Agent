# PR: Release candidate

## Title

`chore: prepare 1.0.0 release candidate`

## Summary

- align public package scope and repository metadata under the Pocket Agent name
- remove the lingering Next.js ESLint plugin warning from the web build path
- publish `1.0.0` release notes and final release-candidate tracking docs

## Files Changed

- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.base.json`
- `eslint.config.mjs`
- `apps/*`
- `packages/*`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.0.0.md`

## Test Evidence

- `corepack pnpm install`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

## Risks / Follow-ups

- the repo now reflects the Pocket Agent public identity, but external consumers should still treat `1.0.0` as a release candidate until deployment packaging and live transport are exercised outside local development
- websocket transport and deeper Codex adapter coverage remain future roadmap work beyond the release-candidate baseline
