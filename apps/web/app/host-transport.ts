'use client';

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

interface SharedTransportConnection {
  socket: WebSocket;
  listeners: Set<TransportListener>;
  threadSubscriptions: Set<string>;
  reviewSubscribed: boolean;
  pendingMessages: string[];
}

const transportConnections = new Map<string, SharedTransportConnection>();

function createTransportKey(websocketUrl: string, accessToken: string) {
  return `${websocketUrl}::${accessToken}`;
}

function buildSocketUrl(websocketUrl: string, accessToken: string) {
  const url = new URL(websocketUrl);
  url.searchParams.set('accessToken', accessToken);

  return url.toString();
}

function attachSocket(
  websocketUrl: string,
  accessToken: string,
): SharedTransportConnection {
  const socket = new WebSocket(buildSocketUrl(websocketUrl, accessToken));
  const connection: SharedTransportConnection = {
    socket,
    listeners: new Set(),
    threadSubscriptions: new Set(),
    reviewSubscribed: false,
    pendingMessages: [],
  };

  socket.addEventListener('open', () => {
    while (connection.pendingMessages.length > 0) {
      const nextMessage = connection.pendingMessages.shift();

      if (!nextMessage) {
        continue;
      }

      socket.send(nextMessage);
    }
  });

  socket.addEventListener('message', (event) => {
    const payload = JSON.parse(event.data as string) as unknown;

    for (const listener of connection.listeners) {
      listener(payload);
    }
  });

  socket.addEventListener('close', () => {
    const key = createTransportKey(websocketUrl, accessToken);
    const current = transportConnections.get(key);

    if (current === connection) {
      transportConnections.delete(key);
    }
  });

  return connection;
}

function getConnection(websocketUrl: string, accessToken: string) {
  const key = createTransportKey(websocketUrl, accessToken);
  const existing = transportConnections.get(key);

  if (existing) {
    return existing;
  }

  const connection = attachSocket(websocketUrl, accessToken);
  transportConnections.set(key, connection);

  return connection;
}

function sendSubscription(
  connection: SharedTransportConnection,
  message: TransportSubscriptionMessage,
) {
  const encodedMessage = JSON.stringify(message);

  if (connection.socket.readyState === WebSocket.OPEN) {
    connection.socket.send(encodedMessage);
    return;
  }

  connection.pendingMessages.push(encodedMessage);
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
    sendSubscription(connection, {
      action: 'subscribe',
      threadId: options.threadId,
    });
  }

  if (options.reviewQueue && !connection.reviewSubscribed) {
    connection.reviewSubscribed = true;
    sendSubscription(connection, {
      action: 'subscribe-reviews',
    });
  }

  return () => {
    connection.listeners.delete(options.listener);

    if (connection.listeners.size > 0) {
      return;
    }

    const key = createTransportKey(options.websocketUrl, options.accessToken);
    transportConnections.delete(key);
    connection.socket.close();
  };
}

export function resetHostTransportForTests() {
  for (const connection of transportConnections.values()) {
    connection.socket.close();
  }

  transportConnections.clear();
}
