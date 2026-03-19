# ADR 0002: Monorepo with explicit package boundaries

- Status: Accepted
- Date: 2026-03-19

## Context

The project needs a runnable host, a mobile-first web client, shared protocol contracts, and multiple subsystems that will evolve at different speeds. Public OSS development requires reviewable slices and clear ownership lines.

## Decision

Use a `pnpm` + `turbo` TypeScript monorepo with separate apps and packages. Shared contracts live in dedicated packages rather than being re-exported from apps. Each package exposes narrow interfaces and keeps implementation details private.

## Consequences

- Cross-cutting changes stay reviewable and testable.
- Interfaces can be versioned and documented independently.
- Some boilerplate increases, but package boundaries stay explicit.
