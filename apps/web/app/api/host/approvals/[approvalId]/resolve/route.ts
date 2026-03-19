import { proxyHostRequest } from '../../../proxy';

interface RouteContext {
  params: Promise<{
    approvalId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  const body = (await request.json()) as {
    decision?: 'approved' | 'rejected';
  };
  const { approvalId } = await context.params;

  if (body.decision !== 'approved' && body.decision !== 'rejected') {
    return Response.json(
      { error: 'Invalid approval decision' },
      { status: 400 },
    );
  }

  return proxyHostRequest(`/api/approvals/${approvalId}/resolve`, {
    method: 'POST',
    body: {
      decision: body.decision,
    },
  });
}
