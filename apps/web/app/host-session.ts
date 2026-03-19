import { cookies } from 'next/headers';

const HOST_URL_COOKIE = 'pocket_agent_host_url';
const ACCESS_TOKEN_COOKIE = 'pocket_agent_access_token';

export interface HostSession {
  hostUrl: string | null;
  accessToken: string | null;
}

function envHostSession(): HostSession {
  const hostUrl = process.env.POCKET_AGENT_HOST_URL?.trim() || null;
  const accessToken = process.env.POCKET_AGENT_ACCESS_TOKEN?.trim() || null;

  return {
    hostUrl: hostUrl ? hostUrl.replace(/\/$/, '') : null,
    accessToken,
  };
}

export async function readHostSession(): Promise<HostSession> {
  try {
    const cookieStore = await cookies();
    const hostUrl = cookieStore.get(HOST_URL_COOKIE)?.value?.trim() || null;
    const accessToken =
      cookieStore.get(ACCESS_TOKEN_COOKIE)?.value?.trim() || null;

    if (hostUrl && accessToken) {
      return {
        hostUrl: hostUrl.replace(/\/$/, ''),
        accessToken,
      };
    }
  } catch {
    return envHostSession();
  }

  return envHostSession();
}

export function hostSessionCookieNames() {
  return {
    hostUrl: HOST_URL_COOKIE,
    accessToken: ACCESS_TOKEN_COOKIE,
  };
}
