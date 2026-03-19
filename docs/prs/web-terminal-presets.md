# PR: Web terminal presets

## Title

`feat: add host terminal preset controls to the web shell`

## Summary

- add a web-local proxy route for host preset execution
- add a client preset runner to the thread screen for `lint`, `test`, and `build`
- keep controller gating aligned with the existing host lease model
- add browser coverage for preset execution and disabled viewer behavior

## Files changed

- `apps/web/app/api/host/threads/[threadId]/commands/preset/route.ts`
- `apps/web/app/thread-presets.tsx`
- `apps/web/app/thread-presets.test.tsx`
- `apps/web/app/screens.tsx`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.4.0.md`

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / follow-ups

- Preset output still lands in the timeline and route refresh path rather than a dedicated live command console.
- The web shell still relies on host refresh after execution instead of streaming command output inline as it arrives.
