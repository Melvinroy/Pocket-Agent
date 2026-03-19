'use client';

export type HostTransportState =
  | 'disabled'
  | 'connecting'
  | 'live'
  | 'stale'
  | 'reconnecting'
  | 'closed'
  | 'error';

export interface HostTransportStatus {
  state: HostTransportState;
  reconnectAttempt: number;
  reconnectInMs: number | null;
  lastMessageAt: string | null;
  lastHeartbeatAt: string | null;
  error: string | null;
}

type ThreadSubscriptionMessage = {
  action: 'subscribe';
  threadId: string;
};

type ReviewSubscriptionMessage = {
  action: 'subscribe-reviews';
};

type TransportSubscriptionMessage =
  | ThreadSubscriptionMessage
  | ReviewSubscriptionMessage;

type TransportListener = (message: unknown) => void;
type StatusListener = (status: HostTransportStatus) => void;

interface SharedTransportConnection {
  accessToken: string;
  listeners: Set<TransportListener>;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reviewSubscribed: boolean;
  socket: WebSocket | null;
  staleTimer: ReturnType<typeof setTimeout> | null;
  status: HostTransportStatus;
  statusListeners: Set<StatusListener>;
  threadSubscriptions: Set<string>;
  websocketUrl: string;
}

const STALE_AFTER_MS = 15_000;
const MAX_RECONNECT_DELAY_MS = 8_000;
const transportConnections = new Map<string, SharedTransportConnection>();

function createTransportKey(websocketUrl: string, accessToken: string) {
  return `${websocketUrl}::${accessToken}`;
}

function buildSocketUrl(websocketUrl: string, accessToken: string) {
  const url = new URL(websocketUrl);
  url.searchParams.set('accessToken', accessToken);

  return url.toString();
}

function createDefaultStatus(): HostTransportStatus {
  return {
    state: 'connecting',
    reconnectAttempt: 0,
    reconnectInMs: null,
    lastMessageAt: null,
    lastHeartbeatAt: null,
    error: null,
  };
}

function emitStatus(
  connection: SharedTransportConnection,
  nextStatus: Partial<HostTransportStatus>,
) {
  connection.status = {
    ...connection.status,
    ...nextStatus,
  };

  for (const listener of connection.statusListeners) {
    listener(connection.status);
  }
}

function clearReconnectTimer(connection: SharedTransportConnection) {
  if (!connection.reconnectTimer) {
    return;
  }

  clearTimeout(connection.reconnectTimer);
  connection.reconnectTimer = null;
}

function clearStaleTimer(connection: SharedTransportConnection) {
  if (!connection.staleTimer) {
    return;
  }

  clearTimeout(connection.staleTimer);
  connection.staleTimer = null;
}

function hasActiveSubscribers(connection: SharedTransportConnection) {
  return connection.listeners.size > 0 || connection.statusListeners.size > 0;
}

function cleanupConnection(connection: SharedTransportConnection) {
  clearReconnectTimer(connection);
  clearStaleTimer(connection);

  if (connection.socket) {
    connection.socket.close();
    connection.socket = null;
  }

  transportConnections.delete(
    createTransportKey(connection.websocketUrl, connection.accessToken),
  );
}

function sendMessage(
  connection: SharedTransportConnection,
  message: TransportSubscriptionMessage,
) {
  if (!connection.socket || connection.socket.readyState !== WebSocket.OPEN) {
    return;
  }

  connection.socket.send(JSON.stringify(message));
}

function replaySubscriptions(connection: SharedTransportConnection) {
  for (const threadId of connection.threadSubscriptions) {
    sendMessage(connection, {
      action: 'subscribe',
      threadId,
    });
  }

  if (connection.reviewSubscribed) {
    sendMessage(connection, {
      action: 'subscribe-reviews',
    });
  }
}

function scheduleStaleCheck(connection: SharedTransportConnection) {
  clearStaleTimer(connection);

  connection.staleTimer = setTimeout(() => {
    if (!connection.socket || connection.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    emitStatus(connection, {
      state: 'stale',
    });
  }, STALE_AFTER_MS);
}

function markLive(
  connection: SharedTransportConnection,
  options: {
    heartbeat?: boolean;
  } = {},
) {
  const timestamp = new Date().toISOString();

  emitStatus(connection, {
    state: 'live',
    reconnectAttempt: 0,
    reconnectInMs: null,
    error: null,
    lastMessageAt: timestamp,
    lastHeartbeatAt: options.heartbeat
      ? timestamp
      : connection.status.lastHeartbeatAt,
  });
  scheduleStaleCheck(connection);
}

function scheduleReconnect(connection: SharedTransportConnection) {
  if (connection.reconnectTimer || !hasActiveSubscribers(connection)) {
    return;
  }

  const nextAttempt = connection.status.reconnectAttempt + 1;
  const reconnectInMs = Math.min(
    1_000 * 2 ** (nextAttempt - 1),
    MAX_RECONNECT_DELAY_MS,
  );

  emitStatus(connection, {
    state: 'reconnecting',
    reconnectAttempt: nextAttempt,
    reconnectInMs,
  });

  connection.reconnectTimer = setTimeout(() => {
    connection.reconnectTimer = null;
    openSocket(connection);
  }, reconnectInMs);
}

function openSocket(connection: SharedTransportConnection) {
  const socket = new WebSocket(
    buildSocketUrl(connection.websocketUrl, connection.accessToken),
  );

  connection.socket = socket;
  emitStatus(connection, {
    state:
      connection.status.reconnectAttempt > 0 ? 'reconnecting' : 'connecting',
    reconnectInMs: null,
    error: null,
  });

  socket.addEventListener('open', () => {
    if (connection.socket !== socket) {
      return;
    }

    emitStatus(connection, {
      state: 'live',
      reconnectAttempt: 0,
      reconnectInMs: null,
      error: null,
    });
    replaySubscriptions(connection);
    scheduleStaleCheck(connection);
  });

  socket.addEventListener('message', (event) => {
    if (connection.socket !== socket) {
      return;
    }

    try {
      const payload = JSON.parse(event.data as string) as
        | { type: string; sentAt?: string }
        | unknown;

      if (
        typeof payload === 'object' &&
        payload !== null &&
        'type' in payload &&
        payload.type === 'heartbeat'
      ) {
        markLive(connection, {
          heartbeat: true,
        });
      } else {
        markLive(connection);
      }

      for (const listener of connection.listeners) {
        listener(payload);
      }
    } catch {
      emitStatus(connection, {
        state: 'error',
        error: 'Unable to decode a host transport message',
      });
    }
  });

  socket.addEventListener('error', () => {
    if (connection.socket !== socket) {
      return;
    }

    emitStatus(connection, {
      state: 'error',
      error: 'Host websocket error',
    });
  });

  socket.addEventListener('close', () => {
    if (connection.socket !== socket) {
      return;
    }

    connection.socket = null;
    clearStaleTimer(connection);

    if (!hasActiveSubscribers(connection)) {
      emitStatus(connection, {
        state: 'closed',
      });
      cleanupConnection(connection);
      return;
    }

    scheduleReconnect(connection);
  });
}

function getConnection(websocketUrl: string, accessToken: string) {
  const key = createTransportKey(websocketUrl, accessToken);
  const existing = transportConnections.get(key);

  if (existing) {
    if (
      !existing.socket ||
      existing.socket.readyState === WebSocket.CLOSING ||
      existing.socket.readyState === WebSocket.CLOSED
    ) {
      clearReconnectTimer(existing);
      openSocket(existing);
    }

    return existing;
  }

  const connection: SharedTransportConnection = {
    accessToken,
    listeners: new Set(),
    reconnectTimer: null,
    reviewSubscribed: false,
    socket: null,
    staleTimer: null,
    status: createDefaultStatus(),
    statusListeners: new Set(),
    threadSubscriptions: new Set(),
    websocketUrl,
  };

  transportConnections.set(key, connection);
  openSocket(connection);

  return connection;
}

export function getDisabledHostTransportStatus(): HostTransportStatus {
  return {
    state: 'disabled',
    reconnectAttempt: 0,
    reconnectInMs: null,
    lastMessageAt: null,
    lastHeartbeatAt: null,
    error: null,
  };
}

export function getHostTransportStatusSnapshot(options: {
  websocketUrl: string;
  accessToken: string;
}): HostTransportStatus {
  const connection = transportConnections.get(
    createTransportKey(options.websocketUrl, options.accessToken),
  );

  return connection?.status ?? createDefaultStatus();
}

export function subscribeToHostTransport(options: {
  websocketUrl: string;
  accessToken: string;
  threadId?: string;
  reviewQueue?: boolean;
  listener: TransportListener;
}) {
  const connection = getConnection(options.websocketUrl, options.accessToken);
  connection.listeners.add(options.listener);

  if (
    options.threadId &&
    !connection.threadSubscriptions.has(options.threadId)
  ) {
    connection.threadSubscriptions.add(options.threadId);
    sendMessage(connection, {
      action: 'subscribe',
      threadId: options.threadId,
    });
  }

  if (options.reviewQueue && !connection.reviewSubscribed) {
    connection.reviewSubscribed = true;
    sendMessage(connection, {
      action: 'subscribe-reviews',
    });
  }

  return () => {
    connection.listeners.delete(options.listener);

    if (hasActiveSubscribers(connection)) {
      return;
    }

    cleanupConnection(connection);
  };
}

export function subscribeToHostTransportStatus(options: {
  websocketUrl: string;
  accessToken: string;
  listener: StatusListener;
}) {
  const connection = getConnection(options.websocketUrl, options.accessToken);
  connection.statusListeners.add(options.listener);
  options.listener(connection.status);

  return () => {
    connection.statusListeners.delete(options.listener);

    if (hasActiveSubscribers(connection)) {
      return;
    }

    cleanupConnection(connection);
  };
}

export function reconnectHostTransport(options: {
  websocketUrl: string;
  accessToken: string;
}) {
  const connection = getConnection(options.websocketUrl, options.accessToken);
  clearReconnectTimer(connection);
  clearStaleTimer(connection);

  if (connection.socket) {
    const socket = connection.socket;
    connection.socket = null;
    socket.close();
  }

  emitStatus(connection, {
    state: 'connecting',
    reconnectInMs: null,
    error: null,
  });
  openSocket(connection);
}

export function resetHostTransportForTests() {
  for (const connection of transportConnections.values()) {
    cleanupConnection(connection);
  }

  transportConnections.clear();
}
