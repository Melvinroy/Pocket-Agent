# Threat Model

## Trust boundaries

- The desktop host is trusted for repositories, credentials, execution, and persistence.
- Remote clients are untrusted presentation surfaces until authenticated and authorized by the host.
- Raw Codex App Server traffic is never exposed directly to clients.

## Primary risks

- Credential leakage through logs, screenshots, fixtures, or protocol payloads.
- Unauthorized controller takeover through weak pairing or stale tokens.
- Workspace escape via file path traversal or uncontrolled shell execution.
- Confused-deputy behavior where the client appears authoritative instead of the host.

## Current mitigations

- Host-only credentials and process control.
- Pairing confirmation codes plus short-lived access tokens.
- Controller lease enforcement and revoke flow.
- Workspace path normalization and bounded file access.
- Terminal execution limited to host-defined presets.
