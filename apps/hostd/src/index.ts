import {
  createBridgeCapabilities,
  createMockCodexBridge,
} from '@pocket-agent/codex-bridge';
import {
  DEFAULT_SECURITY_POLICY,
  PairingService,
  redactSecrets,
} from '@pocket-agent/security';
import { createInMemorySessionStore } from '@pocket-agent/session-store';

import { buildHostConfig } from './lib/config.js';
import { createHostGateway } from './lib/gateway.js';

export { buildHostConfig } from './lib/config.js';

export async function run(argv = process.argv.slice(2)): Promise<string> {
  const config = buildHostConfig(process.env);
  const bridge = createMockCodexBridge();

  if (argv.includes('--health')) {
    const capabilities = await createBridgeCapabilities(bridge);
    const payload = {
      status: 'ok',
      version: '0.8.0',
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
      transport: 'http',
    });
  }

  return 'Pocket Agent host daemon bootstrap ready';
}

if (process.argv[1]?.endsWith('index.ts')) {
  run().then((output) => {
    process.stdout.write(`${output}\n`);
  });
}
