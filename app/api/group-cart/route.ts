import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { canonicalGroupItems, createGroup, readGroup, changeGroup, type GroupOperation } from '@/lib/group-cart-store';
import { readSiteContent } from '@/lib/site-content';
import { sameOrigin } from '@/lib/request-origin';
import { hasDatabaseConfig } from '@/lib/order-store';
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const validToken = (token: unknown): token is string => typeof token === 'string' && /^[a-f0-9]{32}$/.test(token);
const publicGroup = (group: { token: string; items: unknown[]; revision: number; expiresAt: string }) => ({ token: group.token, items: group.items, revision: group.revision, expiresAt: group.expiresAt });
const limits = new Map<string, { until: number; count: number }>();
function limited(request: NextRequest, max: number) {
  const now = Date.now(); for (const [key, value] of limits) if (value.until < now) limits.delete(key);
  const key = `${request.method}:${(request.headers.get('x-forwarded-for') || 'local').split(',')[0]}`;
  const entry = limits.get(key) || { until: now + 60_000, count: 0 }; entry.count++; limits.set(key, entry); return entry.count > max;
}
async function body(request: NextRequest) { const text = await request.text(); if (text.length > 40000) throw new Error('Request too large.'); return JSON.parse(text); }
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token'); if (!validToken(token)) return fail('Invalid group link.');
  try { const group = await readGroup(token); return group ? NextResponse.json(publicGroup(group), { headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } }) : fail('This group bag has expired.', 404); }
  catch { return fail('Group ordering is temporarily unavailable.', 503); }
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return fail('Invalid origin.', 403);
  if (process.env.NODE_ENV === 'production' && !hasDatabaseConfig()) return fail('Group ordering is temporarily unavailable.', 503);
  if (limited(request, 6)) return fail('Please wait a minute before starting another group.', 429);
  try {
    const input = await body(request), { content } = await readSiteContent();
    const items = canonicalGroupItems(input.items, content);
    const group = { token: randomBytes(16).toString('hex'), items, revision: 1, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
    await createGroup(group); return NextResponse.json(group, { status: 201 });
  } catch (e) { return fail(e instanceof Error && !('code' in e) ? e.message : 'Could not start the group bag.', 400); }
}
export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return fail('Invalid origin.', 403);
  if (process.env.NODE_ENV === 'production' && !hasDatabaseConfig()) return fail('Group ordering is temporarily unavailable.', 503);
  if (limited(request, 120)) return fail('Please wait a moment.', 429);
  try {
    const input = await body(request);
    if (!validToken(input.token) || typeof input.operationId !== 'string' || !/^[a-f0-9-]{36}$/.test(input.operationId) || !Array.isArray(input.operations) || input.operations.length < 1 || input.operations.length > 20) return fail('Invalid group update.');
    const { content } = await readSiteContent();
    const group = await changeGroup(input.token, input.operations as GroupOperation[], content, input.operationId);
    return group ? NextResponse.json(publicGroup(group)) : fail('This group bag has expired.', 404);
  } catch (e) { return fail(e instanceof Error && !('code' in e) ? e.message : 'Could not update the group bag.', 400); }
}
