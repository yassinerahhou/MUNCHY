import 'server-only';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { getPool, hasDatabaseConfig } from '@/lib/order-store';
import type { HospitalityRequest } from '@/lib/hospitality';

const directory = path.resolve(/* turbopackIgnore: true */ process.env.MUNCHY_LOCAL_DATA_DIR || path.join(process.cwd(), '.data'));
const file = path.join(directory, 'hospitality.json');
let queue: Promise<unknown> = Promise.resolve();
async function local(): Promise<HospitalityRequest[]> {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; }
}
async function mutate(work: (rows: HospitalityRequest[]) => void) {
  const next = queue.then(async () => {
    const rows = await local(); work(rows); await mkdir(directory, { recursive: true });
    await writeFile(`${file}.tmp`, JSON.stringify(rows)); await rename(`${file}.tmp`, file);
  });
  queue = next.catch(() => undefined); await next;
}
function configured() { if (process.env.NODE_ENV === 'production' && !hasDatabaseConfig()) throw new Error('DATABASE_REQUIRED'); }
export async function saveRequest(entry: HospitalityRequest) {
  configured();
  if (hasDatabaseConfig()) {
    await getPool().execute('INSERT INTO munchy_hospitality (request_id, kind, status, payload, created_at) VALUES (?, ?, ?, ?, ?)', [entry.id, entry.kind, entry.status, JSON.stringify(entry), new Date(entry.createdAt)]);
  } else await mutate(rows => { rows.unshift(entry); });
}
export async function listRequests(): Promise<HospitalityRequest[]> {
  configured();
  if (!hasDatabaseConfig()) return (await local()).slice(0, 300);
  const [rows] = await getPool().query('SELECT payload, status FROM munchy_hospitality ORDER BY created_at DESC LIMIT 300');
  return (rows as Array<{ payload: string; status: HospitalityRequest['status'] }>).map(row => ({ ...JSON.parse(row.payload), status: row.status }));
}
export async function updateRequest(id: string, status: HospitalityRequest['status']) {
  configured();
  if (hasDatabaseConfig()) {
    const [result] = await getPool().execute('UPDATE munchy_hospitality SET status = ? WHERE request_id = ?', [status, id]);
    return Boolean((result as { affectedRows: number }).affectedRows);
  }
  let found = false;
  await mutate(rows => { const entry = rows.find(row => row.id === id); if (entry) { entry.status = status; found = true; } });
  return found;
}
