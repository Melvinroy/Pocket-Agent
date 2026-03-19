'use client';

import { useEffect, useState } from 'react';

import type { TransportConfig } from './live-data';
import {
  getDisabledHostTransportStatus,
  getHostTransportStatusSnapshot,
  reconnectHostTransport,
  subscribeToHostTransportStatus,
  type HostTransportStatus,
} from './host-transport';

export function useHostTransportStatus(transport: TransportConfig) {
  const [status, setStatus] = useState<HostTransportStatus>(() => {
    if (
      !transport.enabled ||
      !transport.websocketUrl ||
      !transport.accessToken
    ) {
      return getDisabledHostTransportStatus();
    }

    return getHostTransportStatusSnapshot({
      websocketUrl: transport.websocketUrl,
      accessToken: transport.accessToken,
    });
  });

  useEffect(() => {
    if (
      !transport.enabled ||
      !transport.websocketUrl ||
      !transport.accessToken
    ) {
      setStatus(getDisabledHostTransportStatus());
      return;
    }

    return subscribeToHostTransportStatus({
      websocketUrl: transport.websocketUrl,
      accessToken: transport.accessToken,
      listener: setStatus,
    });
  }, [transport.accessToken, transport.enabled, transport.websocketUrl]);

  const reconnect = () => {
    if (
      !transport.enabled ||
      !transport.websocketUrl ||
      !transport.accessToken
    ) {
      return;
    }

    reconnectHostTransport({
      websocketUrl: transport.websocketUrl,
      accessToken: transport.accessToken,
    });
  };

  return {
    reconnect,
    status,
  };
}
