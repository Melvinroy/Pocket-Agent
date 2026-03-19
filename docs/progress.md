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

### Files and review

- Created the `codex/feat/file-browser` slice for host-scoped file access and review flow.
- Added workspace-manager helpers for safe file listing, reading, and writing within the active workspace boundary.
- Added host gateway routes for file browse, file read, file write, and review start, with matching shell surfaces for changed files.
- Promoted the repository version to `0.7.0` and added files milestone release documentation.

### Terminal and worktrees

- Created the `codex/feat/terminal-worktrees` slice for host-side cwd binding and preset execution.
- Added workspace-manager helpers for worktree discovery, worktree rebinding, and terminal preset command resolution.
- Added host gateway routes for worktree list, thread worktree bind, and terminal preset execution, with matching shell surfaces.
- Promoted the repository version to `0.8.0` and added terminal milestone release documentation.

### OSS hardening

- Created the `codex/chore/oss-hardening` slice for public-release readiness work.
- Added install, operator, threat-model, and release-checklist docs.
- Tightened contributor guidance and the compatibility matrix for supported runtime assumptions.
- Promoted the repository version to `0.9.0` and added OSS hardening release documentation.

### Release candidate

- Created the `codex/chore/release-candidate` slice for `1.0.0` stabilization and public naming consistency.
- Renamed workspace packages from `@codex-remote/*` to `@pocket-agent/*` and aligned root metadata with the Pocket Agent identity.
- Added a dedicated Next.js ESLint plugin configuration for the web app to remove framework warning drift from release validation.
- Promoted the repository version to `1.0.0` and added release-candidate documentation.

### Live transport

- Created the `codex/feat/live-transport` slice for live host discovery and streamed thread updates.
- Added websocket transport, workspace and thread summary endpoints, and a host `--serve` path for immediate local bring-up.
- Replaced the web shell's seeded-only route behavior with live host fetches and websocket timeline updates when host credentials are configured.
- Promoted the repository version to `1.1.0` and added live transport milestone documentation.

### Web pairing

- Created the `codex/feat/web-pairing` slice for in-app host onboarding from the web shell.
- Added Next.js pairing proxy routes, cookie-backed host session persistence, and a connect/disconnect panel on the home screen.
- Kept seeded fallback behavior intact while letting the web shell self-bootstrap a live host session without manual env var setup.
- Promoted the repository version to `1.2.0` and added web pairing milestone documentation.

### Web controller actions

- Created the `codex/feat/web-controller-actions` slice for real host-routed thread actions from the web shell.
- Added Next.js proxy routes and a thread action panel for steer, interrupt, and approval resolution using the existing host controller lease.
- Fixed a bridge chunk-processing bug that could stall stdio handshake tests when events and responses shared a read buffer.
- Promoted the repository version to `1.3.0` and added controller action milestone documentation.

### Web terminal presets

- Created the `codex/feat/web-terminal-presets` slice for host-side command presets from the web shell.
- Added a Next.js proxy route and a thread preset runner for host `lint`, `test`, and `build` execution using the bound thread worktree.
- Added browser coverage for controller-gated preset execution from the thread screen.
- Promoted the repository version to `1.4.0` and added terminal preset milestone documentation.

### Web command console

- Created the `codex/feat/web-command-console` slice for inline host command visibility in the thread shell.
- Added server-side extraction of thread command logs from replayable `turn.output` events and a websocket-aware live command console component.
- Added browser coverage for seeded command output and live websocket command updates.
- Promoted the repository version to `1.5.0` and added command console milestone documentation.

### Web file editor

- Created the `codex/feat/web-file-editor` slice for open-from-diff file reading and light editing in the web shell.
- Added a host-routed file page, local proxy route for file read and save, and changed-file links from workspace and thread views.
- Added browser coverage for controller-gated file editing through the host boundary.
- Promoted the repository version to `1.6.0` and added file editor milestone documentation.

### Web review flow

- Created the `codex/feat/web-review-flow` slice for editor-driven review starts from the web shell.
- Added a local proxy route for thread review start and a review launcher on the workspace file page when a thread context is present.
- Added browser coverage for controller-gated host review start from the web editor.
- Promoted the repository version to `1.7.0` and added review flow milestone documentation.
