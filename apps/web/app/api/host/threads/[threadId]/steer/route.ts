import { proxyHostRequest } from '../../../proxy';

interface RouteContext {
  params: Promise<{
    threadId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  const body = (await request.json()) as {
    instruction?: string;
  };
  const { threadId } = await context.params;

  if (!body.instruction?.trim()) {
    return Response.json(
      { error: 'Missing steer instruction' },
      { status: 400 },
    );
  }

  return proxyHostRequest(`/api/threads/${threadId}/steer`, {
    method: 'POST',
    body: {
      instruction: body.instruction.trim(),
    },
  });
}
