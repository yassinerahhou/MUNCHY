import { sameOrigin } from '@/lib/request-origin';
import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/admin-session';
import { readSiteContent, saveSiteContent, validateSiteContent } from '@/lib/site-content';
export async function GET() {
  if (!await hasAdminSession()) return NextResponse.json({ error: 'Sign in to edit content.' }, { status: 401 });
  try { return NextResponse.json(await readSiteContent(), { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return NextResponse.json({ error: 'Content storage is unavailable.' }, { status: 503 }); }
}
export async function PUT(request: NextRequest) {
  if (!await hasAdminSession()) return NextResponse.json({ error: 'Sign in to edit content.' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  try {
    const raw = await request.text(); if (raw.length > 2_000_000) return NextResponse.json({ error: 'Content is too large.' }, { status: 413 });
    const { content, revision } = JSON.parse(raw);
    if (!Number.isInteger(revision) || revision < 0) throw new Error('Invalid revision.');
    validateSiteContent(content);
    const nextRevision = await saveSiteContent(content, revision);
    return NextResponse.json({ saved: true, revision: nextRevision });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save.';
    return NextResponse.json({ error: message === 'CONFLICT' ? 'Another editor saved changes. Reload the editor before saving.' : message }, { status: message === 'CONFLICT' ? 409 : 400 });
  }
}
