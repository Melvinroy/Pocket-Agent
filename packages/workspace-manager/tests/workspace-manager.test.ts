import { describe, expect, it } from 'vitest';

import { resolveWorkspaceBinding } from '../src/index.js';

describe('workspace manager', () => {
  it('prefers active worktree path', () => {
    expect(
      resolveWorkspaceBinding({
        workspaceId: 'workspace-1',
        rootPath: '/repo',
        activeWorktreePath: '/repo/.worktrees/feature',
      }),
    ).toBe('/repo/.worktrees/feature');
  });
});
