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

### Pairing and gateway

- Created the `codex/feat/pairing-gateway` slice for secure host access.
- Added pairing sessions, confirmation codes, short-lived access tokens, and revoke flow to the security package.
- Added a localhost host gateway with pairing, session, revoke, and transport endpoints backed by audit logging and controller-lease checks.
- Promoted the repository version to `0.4.0` and added pairing milestone release documentation.

### Mobile shell

- Created the `codex/feat/mobile-shell` slice for the first phone-first client experience.
- Replaced the placeholder web landing page with workspace, thread, reconnect, presence, and composer route screens.
- Expanded the shared UI package to support reusable stat cards, action strips, and detail lists for the PWA.
- Promoted the repository version to `0.5.0` and added mobile shell milestone release documentation.

### Timeline and approvals

- Created the `codex/feat/timeline-approvals` slice for live thread control and approval handling.
- Added authenticated timeline retrieval, controller-only steer and interrupt actions, and approval resolution to the host gateway.
- Expanded the thread shell to surface approval sheets and controller action affordances.
- Promoted the repository version to `0.6.0` and added timeline milestone release documentation.
