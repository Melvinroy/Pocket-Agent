# PR Summary: session-store

## Title

`feat: add sqlite session store and replay persistence`

## Summary

Implements the persistence baseline for Pocket Agent with a SQLite-backed session store, startup migrations, replay-focused event storage, approvals, paired devices, controller lease handling, and audit log persistence.

## Files changed

- `packages/session-store`
- versioning and milestone docs
- root package metadata

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / follow-ups

- The host daemon does not yet wire the persistent store into the runtime lifecycle.
- Remote gateway and auth still need to consume the controller lease and device records.
