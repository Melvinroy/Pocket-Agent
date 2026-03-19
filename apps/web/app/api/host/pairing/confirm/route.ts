import { NextResponse } from 'next/server';

import { hostSessionCookieNames } from '../../../../host-session';

interface PairingConfirmBody {
  hostUrl?: string;
  pairingId?: string;
  confirmationCode?: string;
  displayName?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as PairingConfirmBody;

  if (
    !body.hostUrl ||
    !body.pairingId ||
    !body.confirmationCode ||
    !body.displayName
  ) {
    return NextResponse.json(
      { error: 'Missing pairing confirmation fields' },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${body.hostUrl.replace(/\/$/, '')}/api/pairing/confirm`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          pairingId: body.pairingId,
          confirmationCode: body.confirmationCode,
          displayName: body.displayName,
        }),
        cache: 'no-store',
      },
    );
    const payload = (await response.json()) as {
      accessToken?: string;
    };

    if (!response.ok || !payload.accessToken) {
      return NextResponse.json(payload, { status: response.status });
    }

    const cookieNames = hostSessionCookieNames();
    const nextResponse = NextResponse.json(payload, {
      status: response.status,
    });

    nextResponse.cookies.set(
      cookieNames.hostUrl,
      body.hostUrl.replace(/\/$/, ''),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
      },
    );
    nextResponse.cookies.set(cookieNames.accessToken, payload.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
    nextResponse.cookies.set(cookieNames.deviceName, body.displayName, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });

    return nextResponse;
  } catch {
    return NextResponse.json(
      { error: 'Unable to confirm pairing with host gateway' },
      { status: 502 },
    );
  }
}
