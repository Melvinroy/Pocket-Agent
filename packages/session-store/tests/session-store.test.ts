import { describe, expect, it } from 'vitest';

import { createInMemorySessionStore } from '../src/index.js';

describe('session store', () => {
  it('starts empty', async () => {
    const store = createInMemorySessionStore();

    await expect(store.listWorkspaces()).resolves.toEqual([]);
    await expect(store.listThreads('workspace-1')).resolves.toEqual([]);
  });
});
