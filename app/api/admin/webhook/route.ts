import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/admin-session';
import { sameOrigin } from '@/lib/request-origin';
import { retryOrderWebhook, webhookConfigured } from '@/lib/order-webhook';
export async function POST(request: NextRequest) {
  if (!sameOrigin(request) || !await hasAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  if (!webhookConfigured()) return NextResponse.json({ error: 'Configure ORDER_WEBHOOK_URL and ORDER_WEBHOOK_SECRET first.' }, { status: 503 });
  try {
    const { code } = await request.json();
    if (typeof code !== 'string' || !/^MC-[A-F0-9]{6}$/.test(code)) return NextResponse.json({ error: 'Invalid order code' }, { status: 400 });
    const result = await retryOrderWebhook(code);
    return result ? NextResponse.json(result) : NextResponse.json({ error: 'Order not found' }, { status: 404 });
  } catch { return NextResponse.json({ error: 'Delivery failed. The original order is still saved.' }, { status: 502 }); }
}
