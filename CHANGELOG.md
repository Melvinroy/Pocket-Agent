# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2026-03-19

### Added

- Host review start flow from the web file editor.
- Local proxy route for controller-gated thread review actions from the web app.
- Review launcher coverage for editor-driven host review starts.

## [1.6.0] - 2026-03-19

### Added

- Host-routed workspace file editor page in the web shell.
- Local proxy route for host file read and save actions from the web app.
- Changed-file links from workspace and thread views into the editor flow.
- Browser coverage for controller-gated file editing.

## [1.5.0] - 2026-03-19

### Added

- Live command console in the thread screen for recent host preset output.
- Websocket-aware command output updates for new `turn.output` timeline events.
- Browser coverage for seeded and live command console behavior.

## [1.4.0] - 2026-03-19

### Added

- Next.js host proxy route for running thread terminal presets from the web app.
- Terminal preset runner in the thread screen for host `lint`, `test`, and `build` actions.
- Browser coverage for host preset execution and controller gating.

## [1.3.0] - 2026-03-19

### Added

- Next.js host proxy routes for thread steer, thread interrupt, and approval resolution.
- Controller action panel in the web thread screen for steer, interrupt, and approval decisions.
- Browser coverage for the controller action panel and route refresh behavior.

### Fixed

- Bridge stdio response handling when event and response envelopes arrive in the same chunk.

## [1.2.0] - 2026-03-19

### Added

- In-app web pairing routes that proxy pairing start and confirm through the Next.js app.
- Cookie-backed host session persistence for the web shell.
- Home-screen connect panel for host URL entry, pairing confirmation, and disconnect.

## [1.1.0] - 2026-03-19

### Added

- Host gateway discovery endpoints for workspace and thread summaries.
- Websocket transport at `/api/ws` for live thread timeline subscriptions.
- Web shell host integration that uses `POCKET_AGENT_HOST_URL` and `POCKET_AGENT_ACCESS_TOKEN` when available.
- Host `--serve` mode that seeds a local demo workspace and prints a controller token for dogfooding.

## [1.0.0] - 2026-03-19

### Changed

- Promoted the repository to the first stable Pocket Agent public release candidate.
- Renamed the workspace package scope from `@codex-remote/*` to `@pocket-agent/*` for public OSS consistency.
- Added the Next.js ESLint plugin to the web app lint path to keep release validation free of framework warnings.

### Added

- `1.0.0` release notes and release-candidate PR summary scaffolding.

## [0.4.0] - 2026-03-19

### Added

- Pairing service for confirmation-code handshakes and short-lived access tokens.
- Host HTTP gateway endpoints for pairing start, pairing confirm, token revoke, session introspection, and transport discovery.
- Controller versus viewer role handling with controller-lease enforcement.
- Gateway tests covering pairing, authenticated session lookup, and revoke flow.

## [0.5.0] - 2026-03-19

### Added

- Mobile-first PWA dashboard for workspace and session posture.
- Workspace detail and thread detail routes with reconnect, presence, and composer states.
- Expanded shared UI primitives for stats, action strips, detail lists, and composer surfaces.
- Route-level browser tests for the home, workspace, and thread shells.

## [0.6.0] - 2026-03-19

### Added

- Authenticated timeline retrieval endpoint for replayable thread events and approvals.
- Controller-gated steer, interrupt, and approval resolution actions on the host gateway.
- Protocol helpers for timeline entries and approval decisions.
- Approval and control-state surfaces in the thread detail PWA shell.

## [0.7.0] - 2026-03-19

### Added

- Host-safe workspace file listing, reading, and writing helpers with path escape protection.
- Gateway routes for file browse, file read, file write, and review start.
- Changed-file and review surfaces in the workspace and thread mobile shell views.
- Gateway and workspace-manager coverage for file operations and review triggers.

## [0.8.0] - 2026-03-19

### Added

- Workspace worktree discovery and binding helpers.
- Host gateway routes for worktree listing, thread worktree binding, and terminal preset execution.
- Thread and workspace shell surfaces for worktree selection and host-side lint, test, and build presets.
- Integration coverage for worktree binding and preset execution with a host command runner seam.

## [0.9.0] - 2026-03-19

### Added

- Install, operator, threat-model, and release-checklist docs for OSS readiness.
- Expanded contributor guidance and compatibility assumptions for public development.
- Release notes and PR summary scaffolding for the OSS hardening milestone.

## [0.3.0] - 2026-03-19

### Added

- SQLite-backed session store with typed Drizzle schema definitions.
- Migration runner for workspaces, threads, events, approvals, devices, controller leases, and audit log tables.
- Replay APIs and latest-event recovery helpers for thread state reconstruction.
- Controller lease conflict handling and persistence tests.

## [0.2.0] - 2026-03-19

### Added

- Host-only stdio Codex bridge with request and response correlation.
- Spawned bridge process lifecycle events and deterministic fixture coverage.
- Protocol response envelope helper and typed capabilities validation.
- Bridge alpha release notes and PR summary scaffolding.

## [0.1.0] - 2026-03-19

### Added

- TypeScript monorepo scaffold with `pnpm` and `turbo`.
- Initial host daemon and Next.js PWA shell.
- Typed package skeletons for protocol, bridge, persistence, workspace, security, and UI.
- Architecture decision records, release scaffolding, and progress tracking.
