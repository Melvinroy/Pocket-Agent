import { NextResponse } from 'next/server';

import { readHostSession } from '../../host-session';

interface ProxyOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
}

export async function proxyHostRequest(
  path: string,
  options: ProxyOptions = {},
) {
  const { hostUrl, accessToken } = await readHostSession();

  if (!hostUrl || !accessToken) {
    return NextResponse.json(
      { error: 'Host session is not connected' },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(`${hostUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: 'no-store',
    });
    const payload = (await response.json()) as unknown;

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: 'Unable to reach host gateway' },
      { status: 502 },
    );
  }
}
