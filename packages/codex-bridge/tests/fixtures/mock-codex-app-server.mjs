import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

function emit(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

rl.on('line', (line) => {
  const request = JSON.parse(line);

  if (request.kind !== 'request') {
    return;
  }

  if (request.name === 'capabilities.get') {
    emit({
      protocolVersion: request.protocolVersion,
      kind: 'event',
      id: `evt-${request.id}`,
      name: 'bridge.lifecycle',
      payload: {
        status: 'ready',
      },
      timestamp: new Date().toISOString(),
    });

    emit({
      protocolVersion: request.protocolVersion,
      kind: 'response',
      id: `res-${request.id}`,
      requestId: request.id,
      success: true,
      payload: {
        supportsApprovals: true,
        supportsCommandStreaming: true,
        supportsDiffStreaming: true,
        supportsPlanUpdates: true,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (request.name === 'threads.list') {
    emit({
      protocolVersion: request.protocolVersion,
      kind: 'event',
      id: `evt-threads-${request.id}`,
      name: 'turn.output',
      payload: {
        line: 'listing threads',
      },
      timestamp: new Date().toISOString(),
    });

    emit({
      protocolVersion: request.protocolVersion,
      kind: 'response',
      id: `res-threads-${request.id}`,
      requestId: request.id,
      success: true,
      payload: {
        threads: [
          {
            id: 'thread-1',
            title: 'Bootstrap bridge',
          },
        ],
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  emit({
    protocolVersion: request.protocolVersion,
    kind: 'response',
    id: `err-${request.id}`,
    requestId: request.id,
    success: false,
    error: {
      code: 'unsupported',
      message: `Unsupported request: ${request.name}`,
      retryable: false,
    },
    timestamp: new Date().toISOString(),
  });
});

process.on('SIGTERM', () => {
  process.exit(0);
});
