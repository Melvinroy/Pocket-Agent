import { NextResponse } from 'next/server';

import {
  hostSessionCookieNames,
  readHostSession,
} from '../../../../host-session';

interface RoleSwitchBody {
  role?: 'controller' | 'viewer';
}

interface PairingStartResponse {
  pairingSession?: {
    id: string;
    confirmationCode: string;
  };
  error?: string;
}

interface PairingConfirmResponse {
  accessToken?: string;
  device?: {
    id: string;
    role: 'controller' | 'viewer';
  };
  activeControllerDeviceId?: string | null;
  controllerLease?: {
    deviceId: string;
  } | null;
  error?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as RoleSwitchBody;

  if (body.role !== 'controller' && body.role !== 'viewer') {
    return NextResponse.json(
      { error: 'Invalid session role' },
      { status: 400 },
    );
  }

  const session = await readHostSession();

  if (!session.hostUrl || !session.accessToken || !session.deviceName) {
    return NextResponse.json(
      { error: 'Host session is not connected' },
      { status: 401 },
    );
  }

  try {
    await fetch(`${session.hostUrl}/api/tokens/revoke`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${session.accessToken}`,
      },
      cache: 'no-store',
    });

    const startResponse = await fetch(`${session.hostUrl}/api/pairing/start`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        role: body.role,
      }),
      cache: 'no-store',
    });
    const startPayload = (await startResponse.json()) as PairingStartResponse;

    if (!startResponse.ok || !startPayload.pairingSession) {
      return NextResponse.json(startPayload, { status: startResponse.status });
    }

    const confirmResponse = await fetch(
      `${session.hostUrl}/api/pairing/confirm`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          pairingId: startPayload.pairingSession.id,
          confirmationCode: startPayload.pairingSession.confirmationCode,
          displayName: session.deviceName,
        }),
        cache: 'no-store',
      },
    );
    const confirmPayload =
      (await confirmResponse.json()) as PairingConfirmResponse;

    if (!confirmResponse.ok || !confirmPayload.accessToken) {
      return NextResponse.json(confirmPayload, {
        status: confirmResponse.status,
      });
    }

    const cookieNames = hostSessionCookieNames();
    const response = NextResponse.json(confirmPayload, {
      status: confirmResponse.status,
    });

    response.cookies.set(cookieNames.hostUrl, session.hostUrl, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
    response.cookies.set(cookieNames.accessToken, confirmPayload.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
    response.cookies.set(cookieNames.deviceName, session.deviceName, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Unable to switch host session role' },
      { status: 502 },
    );
  }
}
