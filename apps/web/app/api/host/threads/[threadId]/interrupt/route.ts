import { proxyHostRequest } from '../../../proxy';

interface RouteContext {
  params: Promise<{
    threadId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  const body = (await request.json()) as {
    reason?: string;
  };
  const { threadId } = await context.params;

  return proxyHostRequest(`/api/threads/${threadId}/interrupt`, {
    method: 'POST',
    body: {
      reason:
        body.reason?.trim() || 'Interrupted from the Pocket Agent web shell',
    },
  });
}
