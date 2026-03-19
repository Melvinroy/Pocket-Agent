# ADR 0003: SQLite plus Drizzle for host persistence

- Status: Accepted
- Date: 2026-03-19

## Context

The host daemon needs durable local state for workspaces, threads, event replay, approvals, device pairing, and controller leases. The default deployment is a single operator-owned host machine.

## Decision

Use SQLite as the local persistence engine and model schema plus migrations with Drizzle. This keeps operations simple for single-host use while preserving typed schema definitions and a migration path.

## Consequences

- Local setup stays lightweight and operator-friendly.
- Schema evolution remains explicit and reviewable.
- Multi-host scaling is intentionally deferred.
