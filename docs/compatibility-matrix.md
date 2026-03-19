# Compatibility Matrix

| Component        | Tested assumption               | Status    | Notes                                                        |
| ---------------- | ------------------------------- | --------- | ------------------------------------------------------------ |
| Node.js          | 22.x                            | Supported | Required for local development and CI.                       |
| pnpm             | 9.15.4 via Corepack             | Supported | No global install required.                                  |
| Codex App Server | Adapter contract only           | Pending   | Real stdio integration lands in the Codex bridge milestones. |
| Host OS          | Windows 11 / modern POSIX hosts | Bootstrap | Cross-platform support is a release requirement.             |
