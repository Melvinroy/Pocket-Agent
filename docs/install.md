# Install

## Requirements

- Node.js 22.x
- Corepack enabled
- A local Codex host environment on the desktop machine

## Bootstrap

```bash
corepack enable
corepack pnpm install
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## First run

1. Start the host daemon locally from `apps/hostd`.
2. Keep the host bound to `localhost` unless you have explicitly hardened the deployment path.
3. Pair a controller device through the host gateway before exposing any remote shell surfaces.
4. Confirm that approvals, sandbox, and network defaults match your intended operator policy.
