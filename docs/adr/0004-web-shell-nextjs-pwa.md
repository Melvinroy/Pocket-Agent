# ADR 0004: Next.js mobile-first PWA shell

- Status: Accepted
- Date: 2026-03-19

## Context

The remote client must work well on phones while remaining useful on larger screens. The bootstrap slice needs a production-grade web foundation with clear routing, metadata, and progressive web app affordances.

## Decision

Use Next.js for the web shell and ship it as a mobile-first PWA. Shared UI primitives live in `packages/ui`, while the app owns route composition and remote state orchestration.

## Consequences

- The app gets strong routing, metadata, and build tooling early.
- Mobile installability and shell behavior can be iterated without changing the host runtime.
- Framework coupling exists in the web app, but not in the shared protocol or host packages.
