# AGENTS.md

## Mission

Build a production-quality open-source remote coding environment for a local Codex host.

## Non-negotiables

- Small, reviewable changes
- Tests for meaningful changes
- Docs updated with code
- Secrets never exposed
- Host is source of truth
- Client never talks directly to raw Codex App Server

## Repo workflow

- Use feature branches
- Keep commits atomic
- Keep PRs focused
- Update docs/progress.md after each slice
- Add ADRs for major architectural decisions

## Engineering style

- Prefer simple interfaces
- Prefer explicit code over clever abstractions
- Fix failing tests before moving on
- Leave clear TODOs only when blocked externally

## Milestone order

1. scaffold
2. codex bridge
3. persistence
4. pairing/auth
5. mobile shell
6. streaming/approvals
7. files/review
8. terminal/worktrees
9. hardening/release
