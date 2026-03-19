export interface WorkspaceBinding {
  workspaceId: string;
  rootPath: string;
  activeWorktreePath: string;
}

export function resolveWorkspaceBinding(binding: WorkspaceBinding): string {
  return binding.activeWorktreePath || binding.rootPath;
}
