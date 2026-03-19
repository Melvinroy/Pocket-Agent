# Progress Log

## 2026-03-19

### Scaffold monorepo

- Initialized the Git repository and scaffolded the `codex/chore/scaffold-monorepo` slice.
- Added `pnpm` + `turbo` monorepo standards, CI, linting, testing, and release scaffolding.
- Added initial architecture decision records and package boundaries.
- Added Phase 1 skeletons for `remote-protocol` and `codex-bridge`.

### Codex bridge alpha

- Created the `codex/feat/codex-bridge` slice for host-only stdio bridge integration.
- Replaced the bridge stub with a spawned process bridge that correlates responses and streams lifecycle and output events.
- Added deterministic fixture tests for handshake, streaming, and unsupported request handling.
- Promoted the repository version to `0.2.0` and added bridge milestone release documentation.

### Persistence and replay

- Created the `codex/feat/session-store` slice for durable host persistence.
- Replaced the in-memory session store with a SQLite-backed repository using Drizzle schema definitions and startup migrations.
- Added replay helpers, approvals storage, paired devices, controller lease enforcement, and audit log persistence.
- Promoted the repository version to `0.3.0` and added persistence milestone release documentation.
