import { sameOrigin } from '@/lib/request-origin';
import { NextRequest, NextResponse } from 'next/server';
import { findOrder } from '@/lib/order-store';

const attempts = new Map<string, { count: number; resetAt: number }>();
function isLimited(request: NextRequest) {
  const ip = (request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt <= now) { attempts.set(ip, { count: 1, resetAt: now + 60_000 }); return false; }
  entry.count += 1;
  return entry.count > 20;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (isLimited(request)) return NextResponse.json({ error: 'Too many tracking attempts. Please wait a minute and try again.' }, { status: 429 });
  let input: { code?: string; phoneLast4?: string };
  try { input = await request.json(); } catch { return NextResponse.json({ error: 'Enter the order code and last four phone digits.' }, { status: 400 }); }
  const code = String(input.code || '').trim().toUpperCase();
  const last4 = String(input.phoneLast4 || '').replace(/\D/g, '').slice(-4);
  if (!/^MC-[A-F0-9]{6}$/.test(code) || last4.length !== 4) return NextResponse.json({ error: 'Check the order code and the last four digits of the checkout phone.' }, { status: 400 });
  try {
    const order = await findOrder(code);
    if (!order || !order.phone.endsWith(last4)) return NextResponse.json({ error: 'We couldn’t find that order. Check your details and try again.' }, { status: 404 });
    return NextResponse.json({ code: order.code, status: order.status, fulfillment: order.fulfillment, total: order.total, createdAt: order.createdAt, items: order.items.map(({ name, quantity }) => ({ name, quantity })) });
  } catch { return NextResponse.json({ error: 'Order tracking is temporarily unavailable.' }, { status: 503 }); }
}
