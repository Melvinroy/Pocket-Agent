import { NextResponse } from 'next/server';

interface PairingStartBody {
  hostUrl?: string;
  role?: 'controller' | 'viewer';
}

export async function POST(request: Request) {
  const body = (await request.json()) as PairingStartBody;

  if (!body.hostUrl) {
    return NextResponse.json({ error: 'Missing host URL' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${body.hostUrl.replace(/\/$/, '')}/api/pairing/start`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          role: body.role ?? 'controller',
        }),
        cache: 'no-store',
      },
    );
    const payload = await response.json();

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: 'Unable to reach host gateway' },
      { status: 502 },
    );
  }
}
