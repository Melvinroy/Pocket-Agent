# Contributing

## Project expectations

- Treat every change as public OSS work subject to external review.
- Keep the host authoritative for repos, credentials, execution, and policy.
- Never expose secrets in code, fixtures, logs, screenshots, or docs.
- Prefer small PR-sized slices with matching docs and tests.

## Development loop

1. Create a `codex/*` feature branch.
2. Keep changes small, reviewable, and tested.
3. Run `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, and `corepack pnpm build`.
4. Update `docs/progress.md`, `CHANGELOG.md`, and the relevant `docs/prs/*.md` summary for meaningful slices.
5. Add or update ADRs when a change affects trust boundaries, persistence, or operator behavior.

## Standards

- Do not let clients talk directly to the raw Codex App Server.
- Prefer explicit interfaces and narrow abstractions.
- Keep package boundaries clean across `apps/*` and `packages/*`.
- Record externally meaningful milestone changes in `docs/releases`.
