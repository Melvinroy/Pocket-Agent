import { afterEach, describe, expect, it } from 'vitest';

import {
  PairingService,
  DEFAULT_SECURITY_POLICY,
} from '@codex-remote/security';
import { createInMemorySessionStore } from '@codex-remote/session-store';

import { createHostGateway } from '../src/lib/gateway.js';

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (cleanups.length > 0) {
    await cleanups.pop()?.();
  }
});

describe('host gateway', () => {
  it('creates a pairing session and confirms a viewer device', async () => {
    const gateway = createHostGateway({
      config: {
        bindAddress: '127.0.0.1',
        port: 0,
        logLevel: 'info',
        allowedOrigin: null,
      },
      now: () => new Date('2026-03-19T00:00:00.000Z'),
      pairingService: new PairingService({
        now: () => new Date('2026-03-19T00:00:00.000Z'),
      }),
      sessionStore: createInMemorySessionStore(),
      policy: DEFAULT_SECURITY_POLICY,
    });
    cleanups.push(() => gateway.stop());
    const port = await gateway.start(0);

    const startResponse = await fetch(
      `http://127.0.0.1:${port}/api/pairing/start`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          role: 'viewer',
        }),
      },
    );
    const started = (await startResponse.json()) as {
      pairingSession: { id: string; confirmationCode: string };
    };

    const confirmResponse = await fetch(
      `http://127.0.0.1:${port}/api/pairing/confirm`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          pairingId: started.pairingSession.id,
          confirmationCode: started.pairingSession.confirmationCode,
          displayName: 'Phone',
        }),
      },
    );
    const confirmed = (await confirmResponse.json()) as {
      device: { role: string; id: string };
      accessToken: string;
    };

    expect(confirmResponse.status).toBe(200);
    expect(confirmed.device.role).toBe('viewer');
    expect(confirmed.accessToken).toBeTruthy();
  });

  it('enforces a single active controller lease and supports revoke flow', async () => {
    const gateway = createHostGateway({
      config: {
        bindAddress: '127.0.0.1',
        port: 0,
        logLevel: 'info',
        allowedOrigin: null,
      },
      now: () => new Date('2026-03-19T00:00:00.000Z'),
      pairingService: new PairingService({
        now: () => new Date('2026-03-19T00:00:00.000Z'),
      }),
      sessionStore: createInMemorySessionStore(),
      policy: DEFAULT_SECURITY_POLICY,
    });
    cleanups.push(() => gateway.stop());
    const port = await gateway.start(0);

    const startPairing = async () => {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/pairing/start`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'controller' }),
        },
      );

      return (await response.json()) as {
        pairingSession: { id: string; confirmationCode: string };
      };
    };

    const first = await startPairing();
    const firstConfirm = await fetch(
      `http://127.0.0.1:${port}/api/pairing/confirm`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pairingId: first.pairingSession.id,
          confirmationCode: first.pairingSession.confirmationCode,
          displayName: 'Primary Phone',
        }),
      },
    );
    const firstPayload = (await firstConfirm.json()) as { accessToken: string };

    const second = await startPairing();
    const secondConfirm = await fetch(
      `http://127.0.0.1:${port}/api/pairing/confirm`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pairingId: second.pairingSession.id,
          confirmationCode: second.pairingSession.confirmationCode,
          displayName: 'Secondary Phone',
        }),
      },
    );

    expect(secondConfirm.status).toBe(409);

    const sessionResponse = await fetch(
      `http://127.0.0.1:${port}/api/session`,
      {
        headers: {
          authorization: `Bearer ${firstPayload.accessToken}`,
        },
      },
    );
    const session = (await sessionResponse.json()) as {
      role: string;
      activeControllerDeviceId: string | null;
    };

    expect(session.role).toBe('controller');
    expect(session.activeControllerDeviceId).toBeTruthy();

    const revokeResponse = await fetch(
      `http://127.0.0.1:${port}/api/tokens/revoke`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${firstPayload.accessToken}`,
        },
      },
    );

    expect(revokeResponse.status).toBe(200);
  });
});
