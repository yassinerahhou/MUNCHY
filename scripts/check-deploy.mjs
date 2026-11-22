import { createRequire } from 'node:module';
import mysql from 'mysql2/promise';

createRequire(import.meta.url)('@next/env').loadEnvConfig(process.cwd(), false);
let failed = false;
const fail = (message) => { failed = true; console.error(`FAIL ${message}`); };
for (const key of ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET', 'SITE_URL', 'MUNCHY_WHATSAPP_NUMBER']) {
  const value = process.env[key] || '';
  if (!value || /replace-with|your-domain|example\.com|munchy-demo/i.test(value)) fail(`${key}: missing or placeholder value`);
}
if ((process.env.ADMIN_PASSWORD || '').length < 16) fail('ADMIN_PASSWORD: use at least 16 characters');
if ((process.env.ADMIN_SESSION_SECRET || '').length < 64) fail('ADMIN_SESSION_SECRET: use at least 64 random characters');
if (!/^212[67]\d{8}$/.test(process.env.MUNCHY_WHATSAPP_NUMBER || '')) fail('MUNCHY_WHATSAPP_NUMBER: use Moroccan international digits, e.g. 2126 followed by eight digits');
try { const url = new URL(process.env.SITE_URL); if (url.protocol !== 'https:' || url.pathname !== '/') throw new Error(); }
catch { fail('SITE_URL: use your HTTPS website origin without a path'); }
if (process.env.MUNCHY_FORCE_LOCAL_DATA === '1') fail('Remove MUNCHY_FORCE_LOCAL_DATA for production');
if (!failed) {
  let connection;
  try {
    connection = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, connectTimeout: 8000, timezone: 'Z' });
    for (const table of ['munchy_orders', 'munchy_catering_leads', 'munchy_content', 'munchy_media']) await connection.query(`SELECT 1 FROM ${table} LIMIT 1`);
    console.log('PASS production configuration and four database tables');
  } catch { fail('Database unavailable or schema incomplete. Check hPanel credentials and import db/schema.sql.'); }
  finally { await connection?.end(); }
}
if (failed) process.exitCode = 1;
