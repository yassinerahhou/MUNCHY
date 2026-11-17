import 'server-only';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getPool, hasDatabaseConfig } from '@/lib/order-store';
const directory = path.resolve(/* turbopackIgnore: true */ process.env.MUNCHY_LOCAL_DATA_DIR || path.join(process.cwd(), '.data'));
let schema: Promise<unknown> | undefined;
async function ensureSchema() { if (!schema) schema = getPool().query('CREATE TABLE IF NOT EXISTS munchy_media (media_id VARCHAR(50) PRIMARY KEY, payload MEDIUMBLOB NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)').catch((error) => { schema = undefined; throw error; }); await schema; }
export async function saveMedia(id: string, bytes: Buffer) {
  if (process.env.NODE_ENV === 'production' && !hasDatabaseConfig()) throw new Error('Configure the database before uploading.');
  if (hasDatabaseConfig()) { await ensureSchema(); await getPool().execute('INSERT INTO munchy_media (media_id, payload) VALUES (?, ?)', [id, bytes]); return; }
  await mkdir(path.join(directory, 'media'), { recursive: true }); await writeFile(path.join(directory, 'media', `${id}.webp`), bytes);
}
export async function readMedia(id: string): Promise<Buffer | undefined> {
  if (!/^[a-f0-9-]{36}$/.test(id)) return undefined;
  if (hasDatabaseConfig()) { await ensureSchema(); const [rows] = await getPool().execute('SELECT payload FROM munchy_media WHERE media_id = ?', [id]); return (rows as Array<{ payload: Buffer }>)[0]?.payload; }
  try { return await readFile(path.join(directory, 'media', `${id}.webp`)); } catch { return undefined; }
}
