# PR: Web file editor

## Title

`feat: add host-routed web file editor`

## Summary

- add a web-local proxy route for host file reads and saves
- add a dedicated workspace file page with light editing support
- link changed files from workspace and thread screens into the editor
- keep writes gated to controller sessions while preserving viewer read-only access

## Files changed

- `apps/web/app/api/host/workspaces/[workspaceId]/file/route.ts`
- `apps/web/app/file-editor.tsx`
- `apps/web/app/file-editor.test.tsx`
- `apps/web/app/workspaces/[workspaceId]/file/page.tsx`
- `apps/web/app/live-data.ts`
- `apps/web/app/mock-data.ts`
- `apps/web/app/screens.tsx`
- `README.md`
- `CHANGELOG.md`
- `docs/progress.md`
- `docs/releases/1.6.0.md`

## Test evidence

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Risks / follow-ups

- The current editor is a light text surface; diff-aware review and richer merge semantics remain follow-on work.
- The file page currently opens by path query rather than deep linked diff context with cursor or hunk location.
