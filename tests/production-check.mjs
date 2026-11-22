import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

// Isolated production process: verify misconfiguration fails safely, without a real database.
const base = 'http://127.0.0.1:3002';
const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3002'], {
  env: { ...process.env, NODE_ENV: 'production', DB_HOST: '', DB_NAME: '', DB_USER: '', DB_PASSWORD: '', ADMIN_PASSWORD: '', ADMIN_SESSION_SECRET: '', SITE_URL: '', BUSINESS_VERIFIED: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
app.stdout.on('data', data => { output += data; });
app.stderr.on('data', data => { output += data; });
try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    if (app.exitCode !== null) throw new Error(output);
    try { await fetch(`${base}/api/health`); ready = true; break; } catch { await delay(1000); }
  }
  assert.ok(ready, output);
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await fetch(`${base}/api/health`)).status, 503);
  const order = await fetch(`${base}/api/orders`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: base },
    body: JSON.stringify({ name: 'Deployment check', phone: '+212600000001', fulfillment: 'pickup', items: [{ id: 'double-smash', quantity: 1 }] }),
  });
  assert.equal(order.status, 503, 'Production must not silently store orders in local JSON');
  const login = await fetch(`${base}/api/admin/session`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: base }, body: JSON.stringify({ password: 'munchy-demo-2026' }),
  });
  assert.equal(login.status, 401, 'Development password must not authenticate in production');
  console.log('PASS production homepage, readiness 503, refused unconfigured writes, and disabled demo login');
} finally {
  app.kill('SIGTERM');
  await Promise.race([new Promise(resolve => app.once('exit', resolve)), delay(5000)]);
}
