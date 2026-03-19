import { NextResponse } from 'next/server';

import { hostSessionCookieNames } from '../../../host-session';

interface HostSessionBody {
  hostUrl?: string;
  accessToken?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as HostSessionBody;

  if (!body.hostUrl || !body.accessToken) {
    return NextResponse.json(
      { error: 'Missing host session fields' },
      { status: 400 },
    );
  }

  const cookieNames = hostSessionCookieNames();
  const response = NextResponse.json({ status: 'connected' });

  response.cookies.set(cookieNames.hostUrl, body.hostUrl.replace(/\/$/, ''), {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
  });
  response.cookies.set(cookieNames.accessToken, body.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
  });

  return response;
}

export async function DELETE() {
  const cookieNames = hostSessionCookieNames();
  const response = NextResponse.json({ status: 'disconnected' });

  response.cookies.set(cookieNames.hostUrl, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    expires: new Date(0),
  });
  response.cookies.set(cookieNames.accessToken, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    expires: new Date(0),
  });

  return response;
}
