import { sameOrigin } from '@/lib/request-origin';
import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/admin-session';
import { listOrders, updateOrderStatus, type OrderStatus } from '@/lib/order-store';

const statuses: OrderStatus[] = ['received', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];

export async function GET() {
  if (!await hasAdminSession()) return NextResponse.json({ error: 'Sign in to view orders.' }, { status: 401 });
  try { return NextResponse.json({ orders: await listOrders() }); }
  catch { return NextResponse.json({ error: 'The order database is unavailable.' }, { status: 503 }); }
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (!await hasAdminSession()) return NextResponse.json({ error: 'Sign in to update orders.' }, { status: 401 });
  let input: { code?: string; status?: OrderStatus };
  try { input = await request.json(); } catch { return NextResponse.json({ error: 'Choose an order and a valid status.' }, { status: 400 }); }
  if (!input.code || !statuses.includes(input.status as OrderStatus)) return NextResponse.json({ error: 'Choose an order and a valid status.' }, { status: 400 });
  try {
    const updated = await updateOrderStatus(input.code, input.status as OrderStatus);
    return updated ? NextResponse.json({ updated: true }) : NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  } catch { return NextResponse.json({ error: 'The order database is unavailable.' }, { status: 503 }); }
}
