import { EventEmitter } from 'node:events';

import {
  createEventEnvelope,
  createRequestEnvelope,
  type EventEnvelope,
  type ProtocolTransport,
  type RequestEnvelope,
} from '@codex-remote/remote-protocol';

export interface CodexCapabilities {
  supportsApprovals: boolean;
  supportsCommandStreaming: boolean;
  supportsDiffStreaming: boolean;
  supportsPlanUpdates: boolean;
}

export interface CodexBridge {
  handshake(): Promise<CodexCapabilities>;
  send(request: RequestEnvelope): Promise<void>;
  subscribe(listener: (event: EventEnvelope) => void): () => void;
}

export class StdioCodexBridge implements CodexBridge {
  private readonly emitter = new EventEmitter();

  public constructor(private readonly transport: ProtocolTransport) {}

  public async handshake(): Promise<CodexCapabilities> {
    await this.transport.send(
      createRequestEnvelope('capabilities.get', {}, 'capabilities-bootstrap'),
    );
    return {
      supportsApprovals: true,
      supportsCommandStreaming: true,
      supportsDiffStreaming: true,
      supportsPlanUpdates: true,
    };
  }

  public async send(request: RequestEnvelope): Promise<void> {
    await this.transport.send(request);
  }

  public subscribe(listener: (event: EventEnvelope) => void): () => void {
    this.emitter.on('event', listener);
    return () => {
      this.emitter.off('event', listener);
    };
  }

  public emitFixtureEvent(
    name: EventEnvelope['name'],
    payload: EventEnvelope['payload'],
  ): void {
    this.emitter.emit('event', createEventEnvelope(name, payload));
  }
}

export function createMockCodexBridge(): StdioCodexBridge {
  const transport: ProtocolTransport = {
    async send() {
      return undefined;
    },
  };

  return new StdioCodexBridge(transport);
}

export function createBridgeCapabilities(
  _bridge: CodexBridge,
): CodexCapabilities {
  return {
    supportsApprovals: true,
    supportsCommandStreaming: true,
    supportsDiffStreaming: true,
    supportsPlanUpdates: true,
  };
}
