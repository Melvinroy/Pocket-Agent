# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
