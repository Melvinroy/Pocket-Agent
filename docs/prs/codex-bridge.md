# PR Summary: codex-bridge

## Title

`feat: add codex app-server stdio bridge alpha`

## Summary

Implements the first real Codex bridge slice: a host-only stdio bridge that spawns a child process, sends typed protocol requests, correlates responses, emits lifecycle and streamed events, and ships fixture-based tests for deterministic validation.

## Files changed

- `packages/codex-bridge`
- `packages/remote-protocol`
- `apps/hostd`
- release and progress documentation

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / follow-ups

- The fixture child process models the bridge contract but not a real Codex App Server yet.
- Gateway transport, persistence, and auth layers still need to be integrated on top of the bridge.
