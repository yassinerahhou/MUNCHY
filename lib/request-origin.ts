import { NextRequest } from 'next/server';
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const source = new URL(origin);
    if (source.host === request.headers.get('host') || source.host === request.nextUrl.host) return true;
    // Codex's local preview forwards through this address to the localhost dev server.
    return process.env.NODE_ENV === 'development' && source.hostname === '172.16.0.2' && source.port === request.nextUrl.port;
  } catch { return false; }
}
