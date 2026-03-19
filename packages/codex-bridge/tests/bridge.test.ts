import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it, vi } from 'vitest';

import { createRequestEnvelope } from '@pocket-agent/remote-protocol';

import {
  createMockCodexBridge,
  spawnStdioCodexBridge,
  StdioCodexBridge,
} from '../src/index.js';

const fixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'mock-codex-app-server.mjs',
);

describe('codex bridge', () => {
  it('returns mock capabilities for bootstrap paths', async () => {
    const bridge = createMockCodexBridge();

    await expect(bridge.handshake()).resolves.toEqual({
      supportsApprovals: true,
      supportsCommandStreaming: true,
      supportsDiffStreaming: true,
      supportsPlanUpdates: true,
    });
  });

  it('handshakes against a spawned stdio process', async () => {
    const bridge = spawnStdioCodexBridge(
      {
        command: process.execPath,
        args: [fixturePath],
      },
      () => 'req-capabilities',
    );

    await expect(bridge.handshake()).resolves.toEqual({
      supportsApprovals: true,
      supportsCommandStreaming: true,
      supportsDiffStreaming: true,
      supportsPlanUpdates: true,
    });

    await bridge.dispose();
  }, 20_000);

  it('streams lifecycle and output events from the child process', async () => {
    const bridge = spawnStdioCodexBridge({
      command: process.execPath,
      args: [fixturePath],
    });
    const listener = vi.fn();
    const outputEventSeen = new Promise<void>((resolve) => {
      const waitForOutput = (event: unknown) => {
        if (
          typeof event === 'object' &&
          event !== null &&
          'kind' in event &&
          'name' in event &&
          event.kind === 'event' &&
          event.name === 'turn.output'
        ) {
          resolve();
        }
      };

      listener.mockImplementation(waitForOutput);
    });

    const unsubscribe = bridge.subscribe(listener);
    await bridge.handshake();
    await bridge.send(createRequestEnvelope('threads.list', {}, 'req-threads'));
    await outputEventSeen;
    unsubscribe();
    await bridge.dispose();

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'event',
        name: 'bridge.lifecycle',
      }),
    );
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'event',
        name: 'turn.output',
      }),
    );
  }, 20_000);

  it('rejects unsupported requests from the child process', async () => {
    const bridge = spawnStdioCodexBridge({
      command: process.execPath,
      args: [fixturePath],
    });

    await expect(
      bridge.send(
        createRequestEnvelope('commands.exec', { command: 'pwd' }, 'req-exec'),
      ),
    ).rejects.toThrow(/Unsupported request/);

    await bridge.dispose();
  });

  it('marks the bridge as stopped after disposal', async () => {
    const bridge = spawnStdioCodexBridge({
      command: process.execPath,
      args: [fixturePath],
    });

    await bridge.dispose();

    expect(bridge.isRunning()).toBe(false);
    expect(bridge).toBeInstanceOf(StdioCodexBridge);
  });
});
