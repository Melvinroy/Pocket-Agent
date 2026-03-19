# Contributing

## Development loop

1. Create a `codex/*` feature branch.
2. Keep changes small, reviewable, and tested.
3. Run `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, and `corepack pnpm build`.
4. Update `docs/progress.md`, `CHANGELOG.md`, and the relevant `docs/prs/*.md` summary for meaningful slices.

## Standards

- Do not expose secrets in code, fixtures, logs, screenshots, or docs.
- Treat the host machine as the source of truth.
- Do not let clients talk directly to the raw Codex App Server.
- Prefer explicit interfaces and narrow abstractions.
