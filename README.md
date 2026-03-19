# Pocket Agent

Pocket Agent is an open-source, phone-first remote coding environment for a local Codex host. The host machine remains the source of truth for repositories, credentials, execution, and policy while phone and web clients attach through a stable remote protocol.

## Status

Pocket Agent `1.1.0` adds live host transport for dogfooding. The repository now includes a websocket-capable host gateway, live workspace and thread discovery for the web shell, timeline streaming, and a local `--serve` path that prints a controller token for immediate bring-up.

## Principles

- Host is the source of truth.
- The client never talks directly to raw Codex App Server.
- Credentials and execution stay on the host.
- Small, reviewable changes with tests and docs.

## Repository layout

- `apps/hostd`: host daemon that owns Codex process management and remote transport termination.
- `apps/web`: mobile-first Next.js PWA shell.
- `packages/codex-bridge`: host-only Codex adapter boundary.
- `packages/remote-protocol`: stable transport-neutral request, response, and event contracts.
- `packages/session-store`: persistence interfaces and migrations.
- `packages/workspace-manager`: workspace and worktree coordination.
- `packages/security`: pairing, device roles, tokens, audit types, and redaction.
- `packages/ui`: shared UI primitives for the web client.
- `docs/adr`: architectural decision records.
- `docs/prs`: PR summary drafts for each slice.
- `docs/releases`: milestone release notes.

## Quick start

```bash
corepack enable
corepack pnpm install
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm --filter @pocket-agent/hostd dev -- --serve
```

Set `POCKET_AGENT_HOST_URL` and `POCKET_AGENT_ACCESS_TOKEN` for the web app to use the live host transport instead of seeded shell data.

## Compatibility

See `docs/compatibility-matrix.md` for the pinned bootstrap assumptions about Codex host runtime and future App Server integration.

## Operator docs

- `docs/install.md`: local installation and first-run setup
- `docs/operator-guide.md`: day-to-day host operation, pairing, and recovery guidance
- `docs/threat-model.md`: trust boundaries, attack surfaces, and mitigations
- `docs/release-checklist.md`: release readiness checks for milestone tags

## Workflow

- Use feature branches with the `codex/` prefix.
- Keep commits atomic and PR-sized.
- Update `docs/progress.md`, `CHANGELOG.md`, and `docs/prs/*.md` for meaningful slices.
- Add ADRs for architectural decisions.
