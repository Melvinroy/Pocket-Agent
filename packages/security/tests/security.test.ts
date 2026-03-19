import { describe, expect, it } from 'vitest';

import { PairingService, redactSecrets } from '../src/index.js';

describe('security helpers', () => {
  it('redacts nested secret-looking keys', () => {
    expect(
      redactSecrets({
        token: 'abc',
        nested: {
          password: 'def',
          keep: 'value',
        },
      }),
    ).toEqual({
      token: '[redacted]',
      nested: {
        password: '[redacted]',
        keep: 'value',
      },
    });
  });

  it('creates pairings and authenticates short-lived tokens', () => {
    let now = new Date('2026-03-19T00:00:00.000Z');
    const service = new PairingService({
      now: () => now,
      pairingTtlMs: 60_000,
      tokenTtlMs: 60_000,
    });

    const pairing = service.createPairingSession('controller');
    const token = service.confirmPairing(
      pairing.pairingSession.id,
      pairing.pairingSession.confirmationCode,
      'device-1',
    );

    expect(service.authenticate(token.token)).toEqual({
      deviceId: 'device-1',
      role: 'controller',
      token: token.token,
      expiresAt: token.expiresAt,
    });

    now = new Date('2026-03-19T00:02:00.000Z');
    expect(() => service.authenticate(token.token)).toThrow(/expired/);
  });

  it('revokes tokens and rejects bad confirmation codes', () => {
    const service = new PairingService({
      now: () => new Date('2026-03-19T00:00:00.000Z'),
    });
    const pairing = service.createPairingSession('viewer');

    expect(() =>
      service.confirmPairing(pairing.pairingSession.id, '999-999', 'device-1'),
    ).toThrow(/mismatch/);

    const token = service.confirmPairing(
      pairing.pairingSession.id,
      pairing.pairingSession.confirmationCode,
      'device-1',
    );
    service.revokeToken(token.token);

    expect(() => service.authenticate(token.token)).toThrow(/revoked/);
  });
});
