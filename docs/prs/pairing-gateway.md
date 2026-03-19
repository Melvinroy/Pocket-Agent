# PR Summary: pairing-gateway

## Title

`feat: add pairing service and authenticated host gateway`

## Summary

Adds the first authenticated host gateway for Pocket Agent. This slice introduces pairing sessions with confirmation codes, short-lived access tokens, revoke flow, controller versus viewer roles, and localhost HTTP endpoints for pairing, session introspection, and transport discovery.

## Files changed

- `packages/security`
- `apps/hostd`
- milestone docs and version metadata

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

## Risks / follow-ups

- Transport is HTTP-only for now; websocket upgrade is still a follow-up.
- Tokens are in-memory and should later be backed by the persistent store.
