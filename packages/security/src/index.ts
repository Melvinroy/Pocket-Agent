import { randomBytes, randomInt, randomUUID } from 'node:crypto';

export interface SecurityPolicy {
  bindMode: 'localhost';
  workspaceSandbox: 'workspace-write';
  approvals: 'on-request';
  networkAccess: 'disabled' | 'enabled';
  activeControllerMode: 'single-controller';
}

export type DeviceRole = 'controller' | 'viewer';

export interface PairingSession {
  id: string;
  confirmationCode: string;
  expiresAt: string;
  requestedRole: DeviceRole;
  status: 'pending' | 'paired' | 'expired' | 'revoked';
}

export interface PairingResult {
  pairingSession: PairingSession;
  deepLink: string;
  qrText: string;
}

export interface AccessTokenRecord {
  token: string;
  deviceId: string;
  role: DeviceRole;
  expiresAt: string;
  revokedAt: string | null;
}

export interface AuthenticatedDevice {
  deviceId: string;
  role: DeviceRole;
  token: string;
  expiresAt: string;
}

export interface PairingServiceOptions {
  now?: () => Date;
  pairingTtlMs?: number;
  tokenTtlMs?: number;
}

export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  bindMode: 'localhost',
  workspaceSandbox: 'workspace-write',
  approvals: 'on-request',
  networkAccess: 'disabled',
  activeControllerMode: 'single-controller',
};

const SECRET_KEYS = ['token', 'secret', 'authorization', 'password'];

function addMilliseconds(date: Date, milliseconds: number): string {
  return new Date(date.getTime() + milliseconds).toISOString();
}

export function createConfirmationCode(): string {
  return `${randomInt(100, 1000)}-${randomInt(100, 1000)}`;
}

export function createAccessTokenValue(): string {
  return randomBytes(24).toString('base64url');
}

export class PairingService {
  private readonly now: () => Date;
  private readonly pairingTtlMs: number;
  private readonly tokenTtlMs: number;
  private readonly pairingSessions = new Map<string, PairingSession>();
  private readonly accessTokens = new Map<string, AccessTokenRecord>();

  public constructor(options: PairingServiceOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.pairingTtlMs = options.pairingTtlMs ?? 5 * 60 * 1000;
    this.tokenTtlMs = options.tokenTtlMs ?? 60 * 60 * 1000;
  }

  public createPairingSession(requestedRole: DeviceRole): PairingResult {
    const session: PairingSession = {
      id: randomUUID(),
      confirmationCode: createConfirmationCode(),
      expiresAt: addMilliseconds(this.now(), this.pairingTtlMs),
      requestedRole,
      status: 'pending',
    };

    this.pairingSessions.set(session.id, session);

    const qrText = `pocket-agent://pair?pairingId=${session.id}&code=${session.confirmationCode}`;
    return {
      pairingSession: session,
      deepLink: qrText,
      qrText,
    };
  }

  public confirmPairing(
    pairingId: string,
    confirmationCode: string,
    deviceId: string,
  ): AccessTokenRecord {
    const session = this.pairingSessions.get(pairingId);

    if (!session) {
      throw new Error('Unknown pairing session');
    }

    if (session.status !== 'pending') {
      throw new Error('Pairing session is not pending');
    }

    if (session.expiresAt <= this.now().toISOString()) {
      session.status = 'expired';
      throw new Error('Pairing session expired');
    }

    if (session.confirmationCode !== confirmationCode) {
      throw new Error('Confirmation code mismatch');
    }

    session.status = 'paired';

    const tokenRecord: AccessTokenRecord = {
      token: createAccessTokenValue(),
      deviceId,
      role: session.requestedRole,
      expiresAt: addMilliseconds(this.now(), this.tokenTtlMs),
      revokedAt: null,
    };

    this.accessTokens.set(tokenRecord.token, tokenRecord);
    return tokenRecord;
  }

  public authenticate(token: string): AuthenticatedDevice {
    const record = this.accessTokens.get(token);

    if (!record) {
      throw new Error('Invalid token');
    }

    if (record.revokedAt) {
      throw new Error('Token revoked');
    }

    if (record.expiresAt <= this.now().toISOString()) {
      throw new Error('Token expired');
    }

    return {
      deviceId: record.deviceId,
      role: record.role,
      token: record.token,
      expiresAt: record.expiresAt,
    };
  }

  public revokeToken(token: string): void {
    const record = this.accessTokens.get(token);

    if (!record) {
      throw new Error('Invalid token');
    }

    record.revokedAt = this.now().toISOString();
  }

  public listActiveTokens(): AccessTokenRecord[] {
    return [...this.accessTokens.values()].filter(
      (record) =>
        record.revokedAt === null && record.expiresAt > this.now().toISOString(),
    );
  }
}

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
