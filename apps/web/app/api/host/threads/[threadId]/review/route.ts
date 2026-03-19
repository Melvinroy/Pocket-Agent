import { NextResponse } from 'next/server';

import { proxyHostRequest } from '../../../proxy';

interface RouteContext {
  params: Promise<{
    threadId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  const body = (await request.json()) as {
    path?: string;
    summary?: string;
  };
  const { threadId } = await context.params;

  if (!body.path) {
    return NextResponse.json({ error: 'Missing review path' }, { status: 400 });
  }

  return proxyHostRequest(`/api/threads/${threadId}/review`, {
    method: 'POST',
    body: {
      path: body.path,
      summary:
        body.summary ?? 'Review started from the Pocket Agent web editor',
    },
  });
}
