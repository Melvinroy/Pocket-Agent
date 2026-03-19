import { proxyHostRequest } from '../../../../proxy';

interface RouteContext {
  params: Promise<{
    threadId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  const body = (await request.json()) as {
    preset?: 'lint' | 'test' | 'build';
  };
  const { threadId } = await context.params;

  if (
    body.preset !== 'lint' &&
    body.preset !== 'test' &&
    body.preset !== 'build'
  ) {
    return Response.json({ error: 'Invalid terminal preset' }, { status: 400 });
  }

  return proxyHostRequest(`/api/threads/${threadId}/commands/preset`, {
    method: 'POST',
    body: {
      preset: body.preset,
    },
  });
}
