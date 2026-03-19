import { describe, expect, it, vi } from 'vitest';

import {
  createRequestEnvelope,
  type ProtocolTransport,
} from '@codex-remote/remote-protocol';

import { StdioCodexBridge } from '../src/index.js';

describe('codex bridge', () => {
  it('sends handshake through the transport', async () => {
    const send = vi
      .fn<ProtocolTransport['send']>()
      .mockResolvedValue(undefined);
    const bridge = new StdioCodexBridge({ send });

    const capabilities = await bridge.handshake();

    expect(send).toHaveBeenCalledOnce();
    expect(capabilities.supportsPlanUpdates).toBe(true);
  });

  it('replays subscribed fixture events', () => {
    const bridge = new StdioCodexBridge({
      send: vi.fn().mockResolvedValue(undefined),
    });
    const listener = vi.fn();

    const unsubscribe = bridge.subscribe(listener);
    bridge.emitFixtureEvent('turn.output', { line: 'booting' });
    unsubscribe();

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'event',
        name: 'turn.output',
      }),
    );
  });

  it('forwards explicit requests', async () => {
    const send = vi
      .fn<ProtocolTransport['send']>()
      .mockResolvedValue(undefined);
    const bridge = new StdioCodexBridge({ send });

    await bridge.send(createRequestEnvelope('threads.list', {}, 'req-threads'));

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'request',
        name: 'threads.list',
      }),
    );
  });
});
