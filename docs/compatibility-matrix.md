# Compatibility Matrix

| Component        | Tested assumption                                           | Status    | Notes                                                                  |
| ---------------- | ----------------------------------------------------------- | --------- | ---------------------------------------------------------------------- |
| Node.js          | 22.x                                                        | Supported | Required for local development, SQLite runtime, and CI.                |
| pnpm             | 9.15.4 via Corepack                                         | Supported | No global install required.                                            |
| Turbo            | 2.x                                                         | Supported | Used for workspace orchestration and CI task fan-out.                  |
| Next.js          | 15.5.x                                                      | Supported | Mobile-first web shell baseline.                                       |
| Codex App Server | Host-wrapped stdio adapter contract only                    | Pending   | Remote clients must never speak to raw App Server directly.            |
| Host OS          | Windows 11 / modern POSIX hosts                             | Bootstrap | Windows is actively exercised; POSIX remains a release target.         |
| Security posture | localhost bind, approvals on request, no network by default | Supported | These defaults are part of the product contract and operator guidance. |
