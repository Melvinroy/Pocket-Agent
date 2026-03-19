import {
  createBridgeCapabilities,
  createMockCodexBridge,
} from '@codex-remote/codex-bridge';
import { DEFAULT_SECURITY_POLICY, redactSecrets } from '@codex-remote/security';

import { buildHostConfig } from './lib/config.js';

export { buildHostConfig } from './lib/config.js';

export async function run(argv = process.argv.slice(2)): Promise<string> {
  const config = buildHostConfig(process.env);
  const bridge = createMockCodexBridge();

  if (argv.includes('--health')) {
    const capabilities = await createBridgeCapabilities(bridge);
    const payload = {
      status: 'ok',
      version: '0.3.0',
      host: config,
      policy: DEFAULT_SECURITY_POLICY,
      bridge: capabilities,
    };

    return JSON.stringify(redactSecrets(payload), null, 2);
  }

  return 'Codex Remote host daemon bootstrap ready';
}

if (process.argv[1]?.endsWith('index.ts')) {
  run().then((output) => {
    process.stdout.write(`${output}\n`);
  });
}
