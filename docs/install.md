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

## Live transport bring-up

1. Start the host gateway with `corepack pnpm --filter @pocket-agent/hostd dev -- --serve`.
2. Copy the printed `baseUrl` and `accessToken`.
3. Run the web shell with `POCKET_AGENT_HOST_URL=<baseUrl>` and `POCKET_AGENT_ACCESS_TOKEN=<accessToken>`.
4. Open the thread route and confirm that new steer or approval actions appear without a page refresh.
