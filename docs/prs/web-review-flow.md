# PR: Web review flow

## Title

`feat: add review launch flow to web editor`

## Summary

- add a web-local proxy route for host review start
- preserve thread context on changed-file links into the editor
- add a review launcher to the file page for controller sessions
- add browser coverage for editor-driven host review start

## Files changed

- `apps/web/app/api/host/threads/[threadId]/review/route.ts`
- `apps/web/app/review-launcher.tsx`
- `apps/web/app/review-launcher.test.tsx`
- `apps/web/app/workspaces/[workspaceId]/file/page.tsx`
- `apps/web/app/screens.tsx`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.7.0.md`

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / follow-ups

- Review actions still launch from a file-centric page rather than exposing a fuller review queue or review history.
- The editor preserves thread context via query params; a stronger typed route scheme is a follow-on cleanup if the flow expands.
