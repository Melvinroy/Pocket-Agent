import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  bindWorkspaceWorktree,
  listWorkspaceEntries,
  listWorkspaceWorktrees,
  readWorkspaceFile,
  resolveTerminalPresetCommand,
  resolveWorkspaceBinding,
  resolveWorkspacePath,
  writeWorkspaceFile,
} from '../src/index.js';

function createWorkspaceRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pocket-agent-workspace-'));
}

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

  it('prevents path traversal outside the workspace', () => {
    expect(() =>
      resolveWorkspacePath(
        {
          workspaceId: 'workspace-1',
          rootPath: '/repo',
          activeWorktreePath: '/repo',
        },
        '../secret.txt',
      ),
    ).toThrow(/escapes the workspace root/);
  });

  it('lists, reads, and writes workspace files', async () => {
    const rootPath = createWorkspaceRoot();
    const binding = {
      workspaceId: 'workspace-1',
      rootPath,
      activeWorktreePath: rootPath,
    };

    fs.mkdirSync(path.join(rootPath, 'src'), { recursive: true });
    fs.writeFileSync(path.join(rootPath, 'README.md'), '# Pocket Agent\n');
    fs.writeFileSync(path.join(rootPath, 'src', 'main.ts'), 'export {};\n');

    const entries = await listWorkspaceEntries(binding);
    expect(entries.map((entry) => entry.name)).toEqual(['src', 'README.md']);

    await expect(readWorkspaceFile(binding, 'README.md')).resolves.toContain(
      'Pocket Agent',
    );

    await writeWorkspaceFile(binding, 'notes/todo.md', '- ship review flow\n');

    await expect(
      readWorkspaceFile(binding, 'notes/todo.md'),
    ).resolves.toContain('ship review flow');
  });

  it('lists and binds worktrees plus resolves terminal presets', async () => {
    const rootPath = createWorkspaceRoot();
    fs.mkdirSync(path.join(rootPath, '.worktrees', 'feature-a'), {
      recursive: true,
    });
    const binding = {
      workspaceId: 'workspace-1',
      rootPath,
      activeWorktreePath: rootPath,
    };

    const worktrees = await listWorkspaceWorktrees(binding);
    expect(worktrees.map((worktree) => worktree.name)).toEqual([
      'root',
      'feature-a',
    ]);

    const rebound = bindWorkspaceWorktree(binding, '.worktrees/feature-a');
    expect(rebound.activeWorktreePath).toContain('.worktrees');

    expect(resolveTerminalPresetCommand('test')).toEqual({
      preset: 'test',
      command: 'corepack',
      argv: ['pnpm', 'test'],
    });
  });
});
