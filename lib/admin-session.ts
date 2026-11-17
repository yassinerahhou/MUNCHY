import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'munchy_admin';
const TOKEN_TTL = 8 * 60 * 60;

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (process.env.NODE_ENV === 'production' && !value) throw new Error('ADMIN_SESSION_SECRET_NOT_CONFIGURED');
  return value || 'munchy-local-demo-session-secret-change-before-launch';
}

function signature(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function validAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'development' ? 'munchy-demo-2026' : '');
  if (!expected) return false;
  const actualBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function setAdminSession() {
  const expiresAt = Date.now() + TOKEN_TTL * 1000;
  const payload = Buffer.from(JSON.stringify({ expiresAt })).toString('base64url');
  const value = `${payload}.${signature(payload)}`;
  (await cookies()).set(COOKIE, value, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/admin', maxAge: TOKEN_TTL });
}

export async function clearAdminSession() {
  (await cookies()).set(COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/admin', maxAge: 0 });
}

export async function hasAdminSession() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [payload, supplied] = value.split('.');
  if (!payload || !supplied) return false;
  const expected = signature(payload);
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).expiresAt > Date.now(); }
  catch { return false; }
}
