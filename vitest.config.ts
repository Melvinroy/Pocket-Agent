import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: [
      'apps/**/*.test.ts',
      'apps/**/*.test.tsx',
      'packages/**/*.test.ts',
      'packages/**/*.test.tsx',
    ],
    exclude: ['**/dist/**', '**/.next/**', '**/node_modules/**'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        '**/dist/**',
        '**/.next/**',
        '**/*.d.ts',
        'apps/web/next.config.ts',
      ],
    },
    projects: [
      {
        test: {
          name: 'node',
          include: ['apps/**/*.test.ts', 'packages/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'browser',
          include: ['apps/web/**/*.test.tsx', 'packages/ui/**/*.test.tsx'],
          environment: 'jsdom',
        },
      },
    ],
  },
});
