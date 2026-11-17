import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distName = '.next-test';
const dataDirectory = path.join(root, '.test-data');
const base = process.env.MUNCHY_TEST_URL || 'http://localhost:3001';
const port = new URL(base).port || '80';
const tests = [];
const check = (name, fn) => tests.push({ name, fn });
const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--turbopack', '--hostname', 'localhost', '--port', port], {
  cwd: root,
  env: { ...process.env, MUNCHY_TEST_BUILD_DIR: distName, MUNCHY_LOCAL_DATA_DIR: dataDirectory, MUNCHY_FORCE_LOCAL_DATA: '1', DB_HOST: '', DB_NAME: '', DB_USER: '', DB_PASSWORD: '' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverOutput = '';
app.stdout.on('data', (chunk) => { serverOutput = `${serverOutput}${chunk}`.slice(-7000); });
app.stderr.on('data', (chunk) => { serverOutput = `${serverOutput}${chunk}`.slice(-7000); });
const origin = new URL(base).origin;
const json = (value) => ({ method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify(value) });

check('all customer and operator pages render', async () => {
  for (const route of ['/', '/menu', '/story', '/catering', '/checkout', '/track', '/admin', '/help', '/menu/panini-poulet', '/menu/zaalouk-wrap']) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 200, `${route} should return 200`);
    const html = await response.text();
    assert.match(html, /Munchy|munchy/i, `${route} should include the brand`);
    assert.doesNotMatch(html, /Application error|Internal Server Error/i, `${route} should render without a server error`);
  }
});

check('optimized product images have the correct format and transfer size', async () => {
  const names = (await readdir(path.join(root, 'public/images'))).filter((name) => name.endsWith('.webp')).map((name) => name.replace('.webp', ''));
  for (const name of names) {
    const response = await fetch(`${base}/images/${name}.webp`);
    assert.equal(response.status, 200, `${name} image should be served`);
    assert.match(response.headers.get('content-type') || '', /image\/webp/);
    const bytes = Number(response.headers.get('content-length')) || (await response.arrayBuffer()).byteLength;
    const limit = name.includes("concept") ? 300_000 : 120_000;
    assert.ok(bytes > 0 && bytes <= limit, `${name} image is ${bytes} bytes, limit is ${limit} bytes`);
  }
});

check('order API rejects bad phones and untrusted item prices', async () => {
  const invalidPhone = await fetch(`${base}/api/orders`, json({ name: 'Test Guest', phone: '555123456', address: 'Maârif, Casablanca', items: [{ id: 'double-smash', quantity: 1 }] }));
  assert.equal(invalidPhone.status, 400);
  const fakeProduct = await fetch(`${base}/api/orders`, json({ name: 'Test Guest', phone: '+212600000000', address: 'Maârif, Casablanca', items: [{ id: 'not-a-real-product', quantity: 1, unitPrice: 0.01 }] }));
  assert.equal(fakeProduct.status, 400);
  const foreignOrigin = await fetch(`${base}/api/orders`, { ...json({}), headers: { 'content-type': 'application/json', origin: 'https://attacker.example' } });
  assert.equal(foreignOrigin.status, 403);
});

check('order creation, tracking, kitchen login, and status updates work', async () => {
  const payload = { name: 'Smoke Test Guest', phone: '+212600000000', address: '12 Rue Test, Maârif, Casablanca', fulfillment: 'delivery', changeFor: 'exact', items: [{ id: 'double-smash', quantity: 1, unitPrice: 0.01 }] };
  const createdResponse = await fetch(`${base}/api/orders`, json(payload));
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json();
  assert.match(created.orderCode, /^MC-[A-F0-9]{6}$/);
  assert.ok(created.total > 0, 'server computes a real total from its menu');
  assert.ok(created.pointsEarned >= 0);

  const trackResponse = await fetch(`${base}/api/orders/track`, json({ code: created.orderCode, phoneLast4: '0000' }));
  assert.equal(trackResponse.status, 200);
  assert.equal((await trackResponse.json()).status, 'received');
  const wrongPhone = await fetch(`${base}/api/orders/track`, json({ code: created.orderCode, phoneLast4: '9999' }));
  assert.equal(wrongPhone.status, 404);

  const denied = await fetch(`${base}/api/admin/orders`);
  assert.equal(denied.status, 401, 'kitchen data must require a session');
  const login = await fetch(`${base}/api/admin/session`, json({ password: 'munchy-demo-2026' }));
  assert.equal(login.status, 200);
  const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
  assert.match(cookie, /^munchy_admin=/);
  const orders = await fetch(`${base}/api/admin/orders`, { headers: { cookie } });
  assert.equal(orders.status, 200);
  assert.ok((await orders.json()).orders.some((order) => order.code === created.orderCode));
  const update = await fetch(`${base}/api/admin/orders`, { method: 'PATCH', headers: { cookie, origin, 'content-type': 'application/json' }, body: JSON.stringify({ code: created.orderCode, status: 'preparing' }) });
  assert.equal(update.status, 200);
  const trackedAgain = await fetch(`${base}/api/orders/track`, json({ code: created.orderCode, phoneLast4: '0000' }));
  assert.equal((await trackedAgain.json()).status, 'preparing');
  await fetch(`${base}/api/admin/session`, { method: 'DELETE', headers: { cookie } });
});

check('catering intake validates and stores a lead privately', async () => {
  const bad = await fetch(`${base}/api/catering`, json({ name: 'No', phone: '123', eventType: 'Office lunch', guests: 12 }));
  assert.equal(bad.status, 400);
  const good = await fetch(`${base}/api/catering`, json({ name: 'Smoke Test Host', phone: '+212600000000', email: 'test@example.ma', eventType: 'Office lunch', guests: 12, note: 'Automated smoke test' }));
  assert.equal(good.status, 200);
  const leadsPath = path.join(dataDirectory, 'catering.json');
  const leads = JSON.parse(await readFile(leadsPath, 'utf8'));
  assert.ok(leads.some((lead) => lead.name === 'Smoke Test Host'));
});

check('CMS product create, update, hide and delete change the live storefront and checkout', async () => {
  assert.equal((await fetch(`${base}/api/admin/content`)).status, 401);
  const login = await fetch(`${base}/api/admin/session`, json({ password: 'munchy-demo-2026' }));
  const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
  const headers = { cookie, origin, 'content-type': 'application/json' };
  const snapshot = await (await fetch(`${base}/api/admin/content`, { headers: { cookie } })).json();
  let revision = snapshot.revision;
  const content = structuredClone(snapshot.content);
  assert.equal(new Set(content.products.map((product) => product.image)).size, content.products.length, 'each seed product should have a distinct photo');
  const product = { ...content.products[0], id: 'cms-test-snack', name: 'CMS Test Snack', price: 31, available: true };
  content.products.push(product);
  content.presentation.heroImage = '/images/pizza.webp';
  content.presentation.showSpace = false;
  content.contact.deliveryFee = 12;
  content.contact.freeDeliveryFrom = 1000;
  async function save() {
    const response = await fetch(`${base}/api/admin/content`, { method: 'PUT', headers, body: JSON.stringify({ content, revision }) });
    const result = await response.json(); assert.equal(response.status, 200, result.error); revision = result.revision;
  }
  await save();
  const homepage = await (await fetch(`${base}/`)).text();
  assert.doesNotMatch(homepage, /id="our-space"/);
  assert.match(homepage, /id="home-menu-results"/);
  let page = await fetch(`${base}/menu/cms-test-snack`);
  assert.equal(page.status, 200); assert.match(await page.text(), /CMS Test Snack/);
  const payload = { name: 'CMS Test', phone: '+212600000000', address: '12 Rue Test, Casablanca', items: [{ id: product.id, quantity: 1, unitPrice: 0.01 }] };
  const order = await fetch(`${base}/api/orders`, json(payload));
  assert.equal(order.status, 201); const receipt = await order.json();
  assert.equal(receipt.subtotal, 31); assert.equal(receipt.total, 43);
  product.price = 42;
  await save();
  const updatedOrder = await fetch(`${base}/api/orders`, json(payload));
  assert.equal((await updatedOrder.json()).subtotal, 42);
  const stale = await fetch(`${base}/api/admin/content`, { method: 'PUT', headers, body: JSON.stringify({ content, revision: 0 }) });
  assert.equal(stale.status, 409);
  product.available = false; await save();
  assert.equal((await fetch(`${base}/api/orders`, json(payload))).status, 400);
  content.products = content.products.filter((item) => item.id !== product.id); await save();
  assert.equal((await fetch(`${base}/menu/cms-test-snack`)).status, 404);
  await fetch(`${base}/api/admin/content`, { method: 'PUT', headers, body: JSON.stringify({ content: snapshot.content, revision }) });
});

check('admin image uploads are authenticated, optimized, and served persistently', async () => {
  assert.equal((await fetch(`${base}/api/admin/media`, { method: 'POST' })).status, 401);
  const login = await fetch(`${base}/api/admin/session`, json({ password: 'munchy-demo-2026' }));
  const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
  const body = new FormData();
  body.append('image', new Blob([await readFile(path.join(root, 'public/images/smash-burger.webp'))], { type: 'image/webp' }), 'test-burger.webp');
  const uploaded = await fetch(`${base}/api/admin/media`, { method: 'POST', headers: { cookie, origin }, body });
  const asset = await uploaded.json(); assert.equal(uploaded.status, 201, asset.error);
  assert.match(asset.image, /^\/api\/media\/[a-f0-9-]+$/);
  const image = await fetch(`${base}${asset.image}`); assert.equal(image.status, 200); assert.match(image.headers.get('content-type'), /image\/webp/);
  const unsafe = new FormData(); unsafe.append('image', new Blob(['<svg/>'], { type: 'image/svg+xml' }), 'unsafe.svg');
  assert.equal((await fetch(`${base}/api/admin/media`, { method: 'POST', headers: { cookie, origin }, body: unsafe })).status, 400);
});

check('product meal options are priced by the server and preserved in kitchen tickets', async () => {
  const detail = await fetch(`${base}/menu/double-smash`);
  const html = await detail.text();
  assert.match(html, /Make it yours/); assert.match(html, /Cola/); assert.match(html, /What’s inside/);
  const selections = [{ key: 'sauce', option: 'Garlic sauce' }, { key: 'extra', option: 'Extra cheddar' }, { key: 'side', option: 'Seasoned fries' }, { key: 'drink', option: 'Cola · 33cl' }];
  const payload = { name: 'Meal Test', phone: '+212600000000', address: '12 Rue Test, Casablanca', fulfillment: 'pickup', items: [{ id: 'double-smash--1-1-1-1', productId: 'double-smash', selections, quantity: 2, unitPrice: 0.01 }] };
  const response = await fetch(`${base}/api/orders`, json(payload));
  const receipt = await response.json(); assert.equal(response.status, 201, receipt.error);
  assert.equal(receipt.subtotal, (55 + 7 + 12 + 12) * 2); assert.equal(receipt.total, 172);
  assert.match(decodeURIComponent(receipt.whatsappUrl), /Cola/); assert.match(decodeURIComponent(receipt.whatsappUrl), /Garlic sauce/);
  const login = await fetch(`${base}/api/admin/session`, json({ password: 'munchy-demo-2026' }));
  const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
  const orders = await (await fetch(`${base}/api/admin/orders`, { headers: { cookie } })).json();
  const order = orders.orders.find((item) => item.code === receipt.orderCode);
  assert.equal(order.items[0].unitPrice, 86); assert.equal(order.items[0].quantity, 2);
  assert.equal(order.items[0].customization.length, 4);
  payload.items[0].selections = selections.map((selection) => selection.key === 'drink' ? { ...selection, quantity: 2 } : selection);
  const twoDrinks = await fetch(`${base}/api/orders`, json(payload));
  assert.equal(twoDrinks.status, 201); assert.equal((await twoDrinks.json()).total, 196);
  payload.items[0].selections = [{ key: 'drink', option: 'Made-up free soda' }];
  assert.equal((await fetch(`${base}/api/orders`, json(payload))).status, 400);
  payload.items[0].selections = [{ key: 'drink', option: 'No drink' }, { key: 'drink', option: 'Cola · 33cl' }];
  assert.equal((await fetch(`${base}/api/orders`, json(payload))).status, 400);
});

async function waitForServer() {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (app.exitCode !== null) throw new Error(`Smoke test server exited early.\n${serverOutput}`);
    try { const response = await fetch(`${base}/api/admin/session`); if (response.ok) return; } catch { /* server still compiling */ }
    await delay(1000);
  }
  throw new Error(`Smoke test server did not start.\n${serverOutput}`);
}

let failed = 0;
try {
  await waitForServer();
  for (const test of tests) {
    try { await test.fn(); console.log(`PASS ${test.name}`); }
    catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error instanceof Error ? error.stack : error}`); }
  }
} catch (error) {
  failed += 1;
  console.error(error instanceof Error ? error.message : error);
} finally {
  app.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => app.once('exit', resolve)), delay(5000)]);
  const resolvedData = path.resolve(dataDirectory);
  const resolvedDist = path.resolve(root, distName);
  assert.ok(resolvedData.startsWith(`${root}${path.sep}`) && resolvedDist.startsWith(`${root}${path.sep}`), 'cleanup paths must stay inside the project');
  await rm(resolvedData, { recursive: true, force: true });
  await rm(resolvedDist, { recursive: true, force: true });
}

console.log(`\n${tests.length - failed}/${tests.length} smoke checks passed.`);
if (failed) process.exitCode = 1;
