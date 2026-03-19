# ADR 0001: Host machine is the source of truth

- Status: Accepted
- Date: 2026-03-19

## Context

Codex Remote must support remote control from a phone or browser without moving repositories, credentials, or execution off the host machine. Exposing the raw Codex App Server to remote clients would leak internal protocol churn and increase the risk of secret exposure.

## Decision

The host daemon owns Codex App Server process management, workspace access, policy enforcement, and remote transport termination. Clients interact only with a stable remote protocol implemented by the host daemon.

## Consequences

- Repositories, credentials, and execution remain on the host.
- Client behavior can evolve independently from Codex App Server internals.
- The bridge package becomes the only place that understands Codex-specific adapter details.
