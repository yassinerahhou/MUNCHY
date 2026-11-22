import { NextResponse } from 'next/server';
import { getPool, hasDatabaseConfig } from '@/lib/order-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };
  if (!hasDatabaseConfig()) return NextResponse.json({ status: 'not_ready' }, { status: 503, headers });
  try {
    if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) throw new Error('Admin configuration missing');
    for (const table of ['munchy_orders', 'munchy_catering_leads', 'munchy_content', 'munchy_media']) {
      await getPool().query({ sql: `SELECT 1 FROM ${table} LIMIT 1`, timeout: 5000 });
    }
    return NextResponse.json({ status: 'ok' }, { headers });
  } catch {
    return NextResponse.json({ status: 'not_ready' }, { status: 503, headers });
  }
}
