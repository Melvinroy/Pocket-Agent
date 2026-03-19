export interface SecurityPolicy {
  bindMode: 'localhost';
  workspaceSandbox: 'workspace-write';
  approvals: 'on-request';
  networkAccess: 'disabled' | 'enabled';
  activeControllerMode: 'single-controller';
}

export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  bindMode: 'localhost',
  workspaceSandbox: 'workspace-write',
  approvals: 'on-request',
  networkAccess: 'disabled',
  activeControllerMode: 'single-controller',
};

const SECRET_KEYS = ['token', 'secret', 'authorization', 'password'];

export function redactSecrets<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item)) as T;
  }

  if (value && typeof value === 'object') {
    const redacted = Object.entries(value as Record<string, unknown>).map(
      ([key, nested]) => {
        if (
          SECRET_KEYS.some((candidate) => key.toLowerCase().includes(candidate))
        ) {
          return [key, '[redacted]'];
        }

        return [key, redactSecrets(nested)];
      },
    );

    return Object.fromEntries(redacted) as T;
  }

  return value;
}
