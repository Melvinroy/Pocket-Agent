import { NextResponse } from 'next/server';

import { proxyHostRequest } from '../../../proxy';

interface RouteContext {
  params: Promise<{
    workspaceId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { workspaceId } = await context.params;
  const url = new URL(request.url);
  const filePath = url.searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'Missing file path' }, { status: 400 });
  }

  return proxyHostRequest(
    `/api/workspaces/${workspaceId}/file?path=${encodeURIComponent(filePath)}`,
  );
}

export async function POST(request: Request, context: RouteContext) {
  const { workspaceId } = await context.params;
  const body = (await request.json()) as {
    path?: string;
    contents?: string;
  };

  if (!body.path || typeof body.contents !== 'string') {
    return NextResponse.json(
      { error: 'Missing file save payload' },
      { status: 400 },
    );
  }

  return proxyHostRequest(`/api/workspaces/${workspaceId}/file`, {
    method: 'POST',
    body: {
      path: body.path,
      contents: body.contents,
    },
  });
}
