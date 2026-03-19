import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface WorkspaceBinding {
  workspaceId: string;
  rootPath: string;
  activeWorktreePath: string;
}

export interface WorkspaceFileEntry {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  size: number;
}

export interface WorkspaceWorktree {
  id: string;
  name: string;
  path: string;
  active: boolean;
}

export type TerminalPreset = 'lint' | 'test' | 'build';

export interface TerminalPresetCommand {
  preset: TerminalPreset;
  command: string;
  argv: string[];
}

export function resolveWorkspaceBinding(binding: WorkspaceBinding): string {
  return binding.activeWorktreePath || binding.rootPath;
}

export function resolveWorkspacePath(
  binding: WorkspaceBinding,
  relativePath: string,
): string {
  const basePath = resolveWorkspaceBinding(binding);
  const normalizedPath = relativePath === '' ? '.' : relativePath;
  const resolvedPath = path.resolve(basePath, normalizedPath);
  const relativeToBase = path.relative(basePath, resolvedPath);

  if (relativeToBase.startsWith('..') || path.isAbsolute(relativeToBase)) {
    throw new Error('Requested path escapes the workspace root');
  }

  return resolvedPath;
}

export async function listWorkspaceEntries(
  binding: WorkspaceBinding,
  relativePath = '.',
): Promise<WorkspaceFileEntry[]> {
  const absolutePath = resolveWorkspacePath(binding, relativePath);
  const entries = await readdir(absolutePath, { withFileTypes: true });

  const results = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(absolutePath, entry.name);
      const details = await stat(entryPath);

      return {
        name: entry.name,
        path: path
          .relative(resolveWorkspaceBinding(binding), entryPath)
          .replaceAll('\\', '/'),
        kind: entry.isDirectory() ? 'directory' : 'file',
        size: details.size,
      } satisfies WorkspaceFileEntry;
    }),
  );

  return results.sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === 'directory' ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}

export async function readWorkspaceFile(
  binding: WorkspaceBinding,
  relativePath: string,
): Promise<string> {
  const absolutePath = resolveWorkspacePath(binding, relativePath);
  return readFile(absolutePath, 'utf8');
}

export async function writeWorkspaceFile(
  binding: WorkspaceBinding,
  relativePath: string,
  contents: string,
): Promise<void> {
  const absolutePath = resolveWorkspacePath(binding, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, contents, 'utf8');
}

export async function listWorkspaceWorktrees(
  binding: WorkspaceBinding,
): Promise<WorkspaceWorktree[]> {
  const rootPath = binding.rootPath;
  const worktreesDir = path.join(rootPath, '.worktrees');
  const worktrees: WorkspaceWorktree[] = [
    {
      id: 'root',
      name: 'root',
      path: rootPath,
      active: resolveWorkspaceBinding(binding) === rootPath,
    },
  ];

  try {
    const entries = await readdir(worktreesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const worktreePath = path.join(worktreesDir, entry.name);
      worktrees.push({
        id: entry.name,
        name: entry.name,
        path: worktreePath,
        active: resolveWorkspaceBinding(binding) === worktreePath,
      });
    }
  } catch {
    return worktrees;
  }

  return worktrees;
}

export function bindWorkspaceWorktree(
  binding: WorkspaceBinding,
  worktreePath: string,
): WorkspaceBinding {
  const resolvedPath =
    worktreePath === 'root'
      ? binding.rootPath
      : resolveWorkspacePath(
          {
            ...binding,
            activeWorktreePath: binding.rootPath,
          },
          worktreePath,
        );

  return {
    ...binding,
    activeWorktreePath: resolvedPath,
  };
}

export function resolveTerminalPresetCommand(
  preset: TerminalPreset,
): TerminalPresetCommand {
  const mapping: Record<TerminalPreset, string[]> = {
    lint: ['corepack', 'pnpm', 'lint'],
    test: ['corepack', 'pnpm', 'test'],
    build: ['corepack', 'pnpm', 'build'],
  };
  const argv = mapping[preset];

  return {
    preset,
    command: argv[0]!,
    argv: argv.slice(1),
  };
}
