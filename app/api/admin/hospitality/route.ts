import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/admin-session';
import { sameOrigin } from '@/lib/request-origin';
import { listRequests, updateRequest } from '@/lib/hospitality-store';
export async function GET() {
  if (!await hasAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { return NextResponse.json({ requests: await listRequests() }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return NextResponse.json({ error: 'Inbox unavailable. Check the database schema.' }, { status: 503 }); }
}
export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request) || !await hasAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  try {
    const { id, status } = await request.json();
    if (typeof id !== 'string' || !/^MH-[A-F0-9]{16}$/.test(id) || !['new', 'contacted', 'closed'].includes(status)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    return await updateRequest(id, status) ? NextResponse.json({ saved: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch { return NextResponse.json({ error: 'Could not update request.' }, { status: 503 }); }
}
