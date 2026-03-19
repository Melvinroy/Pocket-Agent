import { describe, expect, it } from 'vitest';

import { redactSecrets } from '../src/index.js';

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
});
