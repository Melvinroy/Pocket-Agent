import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

import {
  capabilitiesSchema,
  createEventEnvelope,
  createRequestEnvelope,
  decodeEnvelope,
  type Capabilities,
  type EventEnvelope,
  type ProtocolTransport,
  type RequestEnvelope,
  type ResponseEnvelope,
} from '@pocket-agent/remote-protocol';

export type CodexCapabilities = Capabilities;

export interface CodexBridge {
  handshake(): Promise<CodexCapabilities>;
  send(request: RequestEnvelope): Promise<ResponseEnvelope>;
  subscribe(listener: (event: EventEnvelope) => void): () => void;
  dispose(): Promise<void>;
  isRunning(): boolean;
}

export interface BridgeSpawnOptions {
  command: string;
  args?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

class MockCodexBridge implements CodexBridge {
  public async handshake(): Promise<CodexCapabilities> {
    return {
      supportsApprovals: true,
      supportsCommandStreaming: true,
      supportsDiffStreaming: true,
      supportsPlanUpdates: true,
    };
  }

  public async send(request: RequestEnvelope): Promise<ResponseEnvelope> {
    return {
      protocolVersion: request.protocolVersion,
      kind: 'response',
      id: 'mock-response',
      requestId: request.id,
      success: true,
      payload: {},
      timestamp: new Date().toISOString(),
    };
  }

  public subscribe(): () => void {
    return () => undefined;
  }

  public async dispose(): Promise<void> {
    return undefined;
  }

  public isRunning(): boolean {
    return true;
  }
}

class BridgeProtocolTransport implements ProtocolTransport {
  public constructor(
    private readonly child: ChildProcessWithoutNullStreams,
    private readonly pending: Map<
      string,
      {
        resolve: (value: ResponseEnvelope) => void;
        reject: (error: Error) => void;
      }
    >,
  ) {}

  public async send(message: RequestEnvelope): Promise<void> {
    const serialized = JSON.stringify(message);

    await new Promise<void>((resolve, reject) => {
      this.child.stdin.write(`${serialized}\n`, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  public waitForResponse(requestId: string): Promise<ResponseEnvelope> {
    return new Promise<ResponseEnvelope>((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
    });
  }
}

export class StdioCodexBridge implements CodexBridge {
  private readonly emitter = new EventEmitter();
  private readonly pending = new Map<
    string,
    {
      resolve: (value: ResponseEnvelope) => void;
      reject: (error: Error) => void;
    }
  >();
  private readonly transport: BridgeProtocolTransport;
  private stdoutBuffer = '';
  private running = true;

  public constructor(
    private readonly child: ChildProcessWithoutNullStreams,
    private readonly requestIdFactory: () => string = randomUUID,
  ) {
    this.transport = new BridgeProtocolTransport(child, this.pending);

    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', (chunk: string) => {
      this.handleStdout(chunk);
    });
    this.child.stderr.setEncoding('utf8');
    this.child.stderr.on('data', (chunk: string) => {
      this.emitLifecycle('stderr', { chunk });
    });
    this.child.once('spawn', () => {
      this.emitLifecycle('spawned', { pid: this.child.pid });
    });
    this.child.once('exit', (code, signal) => {
      this.running = false;
      this.emitLifecycle('exited', { code, signal });
      this.rejectPending(
        new Error(
          `Codex bridge process exited before responding (code=${code}, signal=${signal})`,
        ),
      );
    });
    this.child.once('error', (error) => {
      this.running = false;
      this.emitLifecycle('error', { message: error.message });
      this.rejectPending(error);
    });
  }

  public async handshake(): Promise<CodexCapabilities> {
    const response = await this.send(
      createRequestEnvelope('capabilities.get', {}, this.requestIdFactory()),
    );

    return capabilitiesSchema.parse(response.payload ?? {});
  }

  public async send(request: RequestEnvelope): Promise<ResponseEnvelope> {
    const pendingResponse = this.transport.waitForResponse(request.id);
    await this.transport.send(request);
    const response = await pendingResponse;

    if (!response.success) {
      throw new Error(response.error?.message ?? 'Codex bridge request failed');
    }

    return response;
  }

  public subscribe(listener: (event: EventEnvelope) => void): () => void {
    this.emitter.on('event', listener);
    return () => {
      this.emitter.off('event', listener);
    };
  }

  public async dispose(): Promise<void> {
    if (!this.running) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.child.once('exit', () => resolve());
      this.child.kill();
    });
  }

  public isRunning(): boolean {
    return this.running;
  }

  public emitFixtureEvent(
    name: EventEnvelope['name'],
    payload: EventEnvelope['payload'],
  ): void {
    this.emitter.emit('event', createEventEnvelope(name, payload));
  }

  private handleStdout(chunk: string): void {
    this.stdoutBuffer += chunk;
    const lines = this.stdoutBuffer.split('\n');
    this.stdoutBuffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      const envelope = decodeEnvelope(JSON.parse(trimmed));

      if (envelope.kind === 'event') {
        this.emitter.emit('event', envelope);
        return;
      }

      if (envelope.kind === 'response') {
        const pending = this.pending.get(envelope.requestId);

        if (!pending) {
          this.emitLifecycle('orphan-response', {
            requestId: envelope.requestId,
          });
          return;
        }

        this.pending.delete(envelope.requestId);
        pending.resolve(envelope);
      }
    }
  }

  private emitLifecycle(
    status: string,
    payload: Record<string, unknown>,
  ): void {
    this.emitter.emit(
      'event',
      createEventEnvelope('bridge.lifecycle', {
        status,
        ...payload,
      }),
    );
  }

  private rejectPending(error: Error): void {
    for (const [requestId, pending] of this.pending.entries()) {
      pending.reject(error);
      this.pending.delete(requestId);
    }
  }
}

export function spawnStdioCodexBridge(
  options: BridgeSpawnOptions,
  requestIdFactory?: () => string,
): StdioCodexBridge {
  const child = spawn(options.command, options.args ?? [], {
    cwd: options.cwd,
    env: options.env,
    stdio: 'pipe',
  });

  return new StdioCodexBridge(child, requestIdFactory);
}

export function createMockCodexBridge(): CodexBridge {
  return new MockCodexBridge();
}

export function createBridgeCapabilities(
  bridge: Pick<CodexBridge, 'handshake'>,
): Promise<CodexCapabilities> {
  return bridge.handshake();
}
