import { describe, expect, it } from 'vitest';

import { buildHostConfig, run } from '../src/index.js';

describe('host config', () => {
  it('applies safe defaults', () => {
    expect(buildHostConfig({})).toEqual({
      bindAddress: '127.0.0.1',
      port: 43110,
      logLevel: 'info',
      allowedOrigin: null,
    });
  });

  it('returns a redacted health payload', async () => {
    const output = await run(['--health']);
    const parsed = JSON.parse(output) as {
      status: string;
      policy: { networkAccess: string };
    };

    expect(parsed.status).toBe('ok');
    expect(parsed.policy.networkAccess).toBe('disabled');
  });
});
