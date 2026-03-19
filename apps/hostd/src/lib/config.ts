import { z } from 'zod';

const envSchema = z.object({
  CODEX_REMOTE_PORT: z.string().optional(),
  CODEX_REMOTE_BIND: z.string().optional(),
  CODEX_REMOTE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  CODEX_REMOTE_ALLOWED_ORIGIN: z.string().optional(),
});

export interface HostConfig {
  bindAddress: string;
  port: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  allowedOrigin: string | null;
}

export function buildHostConfig(env: NodeJS.ProcessEnv): HostConfig {
  const parsed = envSchema.parse(env);

  return {
    bindAddress: parsed.CODEX_REMOTE_BIND ?? '127.0.0.1',
    port: parsed.CODEX_REMOTE_PORT ? Number(parsed.CODEX_REMOTE_PORT) : 43110,
    logLevel: parsed.CODEX_REMOTE_LOG_LEVEL ?? 'info',
    allowedOrigin: parsed.CODEX_REMOTE_ALLOWED_ORIGIN ?? null,
  };
}
