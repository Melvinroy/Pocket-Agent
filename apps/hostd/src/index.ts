import { randomUUID } from 'node:crypto';
import path from 'node:path';

import {
  createBridgeCapabilities,
  createMockCodexBridge,
} from '@pocket-agent/codex-bridge';
import {
  DEFAULT_SECURITY_POLICY,
  PairingService,
  redactSecrets,
} from '@pocket-agent/security';
import {
  createInMemorySessionStore,
  type SessionStore,
} from '@pocket-agent/session-store';

import { buildHostConfig } from './lib/config.js';
import { createHostGateway } from './lib/gateway.js';

export { buildHostConfig } from './lib/config.js';

async function seedDemoSessionStore(
  sessionStore: SessionStore,
  now: string,
  rootPath: string,
) {
  await sessionStore.upsertWorkspace({
    id: 'workspace-local',
    rootPath,
    displayName: 'Pocket Agent Local',
    createdAt: now,
  });
  await sessionStore.upsertThread({
    id: 'thread-local',
    workspaceId: 'workspace-local',
    title: 'Live transport demo',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });
  await sessionStore.appendEvent({
    id: randomUUID(),
    threadId: 'thread-local',
    sequence: 1,
    kind: 'turn.output',
    payload: {
      chunk: 'Pocket Agent host gateway is ready for a live client.',
    },
    createdAt: now,
  });
  await sessionStore.saveApproval({
    id: 'approval-local',
    threadId: 'thread-local',
    status: 'pending',
    requestedAt: now,
    resolvedAt: null,
  });
}

async function issueDemoController(
  sessionStore: SessionStore,
  pairingService: PairingService,
  now: string,
) {
  const pairing = pairingService.createPairingSession('controller');
  const deviceId = 'demo-controller';
  const token = pairingService.confirmPairing(
    pairing.pairingSession.id,
    pairing.pairingSession.confirmationCode,
    deviceId,
  );

  await sessionStore.registerDevice({
    id: deviceId,
    displayName: 'Pocket Agent Demo Controller',
    role: 'controller',
    pairedAt: now,
    revokedAt: null,
  });
  await sessionStore.acquireControllerLease({
    id: 'controller',
    deviceId,
    acquiredAt: now,
    expiresAt: token.expiresAt,
  });

  return token;
}

export async function run(argv = process.argv.slice(2)): Promise<string> {
  const config = buildHostConfig(process.env);
  const bridge = createMockCodexBridge();

  if (argv.includes('--health')) {
    const capabilities = await createBridgeCapabilities(bridge);
    const payload = {
      status: 'ok',
      version: '1.1.0',
      host: config,
      policy: DEFAULT_SECURITY_POLICY,
      bridge: capabilities,
    };

    return JSON.stringify(redactSecrets(payload), null, 2);
  }

  if (argv.includes('--gateway-smoke')) {
    const gateway = createHostGateway({
      config: {
        ...config,
        port: 0,
      },
      pairingService: new PairingService(),
      sessionStore: createInMemorySessionStore(),
      policy: DEFAULT_SECURITY_POLICY,
    });
    const port = await gateway.start(0);
    await gateway.stop();

    return JSON.stringify({
      status: 'ok',
      port,
      transport: 'websocket',
    });
  }

  if (argv.includes('--serve')) {
    const now = new Date().toISOString();
    const sessionStore = createInMemorySessionStore();
    const pairingService = new PairingService();
    await seedDemoSessionStore(sessionStore, now, path.resolve(process.cwd()));
    const controller = await issueDemoController(
      sessionStore,
      pairingService,
      now,
    );
    const gateway = createHostGateway({
      config,
      pairingService,
      sessionStore,
      policy: DEFAULT_SECURITY_POLICY,
    });
    const port = await gateway.start(config.port);

    return JSON.stringify(
      {
        status: 'listening',
        baseUrl: `http://${config.bindAddress}:${port}`,
        accessToken: controller.token,
        workspaceId: 'workspace-local',
        threadId: 'thread-local',
        transport: 'websocket',
      },
      null,
      2,
    );
  }

  return 'Pocket Agent host daemon bootstrap ready';
}

if (process.argv[1]?.endsWith('index.ts')) {
  run().then((output) => {
    process.stdout.write(`${output}\n`);
  });
}
