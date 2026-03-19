# PR: OSS hardening

## Title

`chore: add OSS hardening docs and release guidance`

## Summary

- add install, operator, threat-model, and release-checklist documentation
- tighten contributor guidance and runtime compatibility expectations
- prepare the repository for public OSS review and milestone release handling

## Files Changed

- `README.md`
- `CONTRIBUTING.md`
- `docs/compatibility-matrix.md`
- `docs/install.md`
- `docs/operator-guide.md`
- `docs/threat-model.md`
- `docs/release-checklist.md`
- `docs/progress.md`
- `docs/releases/0.9.0.md`

## Test Evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

## Risks / Follow-ups

- these docs describe the current alpha state and should be revisited before a `1.0.0` release candidate
- deeper deployment hardening guidance can expand once websocket transport and install packaging settle
