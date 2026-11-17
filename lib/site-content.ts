import 'server-only';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { getPool, hasDatabaseConfig } from '@/lib/order-store';
import { initialContent, withContentDefaults, type SiteContent } from '@/lib/content-types';

const directory = path.resolve(/* turbopackIgnore: true */ process.env.MUNCHY_LOCAL_DATA_DIR || path.join(process.cwd(), '.data'));
let queue: Promise<unknown> = Promise.resolve();
let schema: Promise<unknown> | undefined;
async function ensureSchema() {
  if (!schema) schema = getPool().query('CREATE TABLE IF NOT EXISTS munchy_content (content_key VARCHAR(50) PRIMARY KEY, payload LONGTEXT NOT NULL, revision INT NOT NULL DEFAULT 1, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)').catch((error) => { schema = undefined; throw error; });
  await schema;
}
export async function readSiteContent(): Promise<{ content: SiteContent; revision: number }> {
  if (hasDatabaseConfig()) {
    await ensureSchema();
    const [rows] = await getPool().execute('SELECT payload, revision FROM munchy_content WHERE content_key = ?', ['site']);
    const row = (rows as Array<{ payload: string; revision: number }>)[0];
    return row ? { content: withContentDefaults(JSON.parse(row.payload)), revision: row.revision } : { content: structuredClone(initialContent), revision: 0 };
  }
  try { const saved = JSON.parse(await readFile(path.join(directory, 'site-content.json'), 'utf8')); return { ...saved, content: withContentDefaults(saved.content) }; }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; return { content: structuredClone(initialContent), revision: 0 }; }
}
export async function saveSiteContent(content: SiteContent, expectedRevision: number) {
  if (process.env.NODE_ENV === 'production' && !hasDatabaseConfig()) throw new Error('Configure the production database before saving content.');
  if (hasDatabaseConfig()) {
    await ensureSchema();
    if (expectedRevision === 0) {
      try { await getPool().execute('INSERT INTO munchy_content (content_key, payload, revision) VALUES (?, ?, 1)', ['site', JSON.stringify(content)]); return 1; }
      catch (error) { if ((error as { code?: string }).code === 'ER_DUP_ENTRY') throw new Error('CONFLICT'); throw error; }
    }
    const [result] = await getPool().execute('UPDATE munchy_content SET payload = ?, revision = revision + 1 WHERE content_key = ? AND revision = ?', [JSON.stringify(content), 'site', expectedRevision]);
    if (!(result as { affectedRows: number }).affectedRows) throw new Error('CONFLICT');
    return expectedRevision + 1;
  }
  const work = queue.then(async () => {
    const current = await readSiteContent();
    if (current.revision !== expectedRevision) throw new Error('CONFLICT');
    const revision = expectedRevision + 1;
    await mkdir(directory, { recursive: true });
    const destination = path.join(directory, 'site-content.json');
    await writeFile(`${destination}.tmp`, JSON.stringify({ content, revision }, null, 2));
    await rename(`${destination}.tmp`, destination);
    return revision;
  });
  queue = work.catch(() => undefined); return work;
}
export function validateSiteContent(value: unknown): asserts value is SiteContent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid site content.');
  const content = value as SiteContent;
  if (!Array.isArray(content.products) || content.products.length < 1 || content.products.length > 250) throw new Error('Keep between 1 and 250 products.');
  if (!content.products.some((product) => product.available !== false)) throw new Error('Keep at least one available product.');
  for (const image of [content.experience?.image, content.experience?.teamImage]) { if (typeof image !== 'string' || !/^\/(?:images\/|api\/media\/)[a-zA-Z0-9._/-]+$/.test(image) || image.includes('..')) throw new Error('Use a local library or uploaded image for the space and team.'); }
  if (!content.branding?.name?.trim() || content.branding.name.length > 40) throw new Error('Use a brand name between 1 and 40 characters.');
  for (const color of [content.branding.accent, content.branding.canvas, content.branding.highlight]) { if (!/^#[a-fA-F0-9]{6}$/.test(color)) throw new Error('Brand colors must be six-digit hex values, such as #ff3b1f.'); }
  for (const image of [content.presentation?.heroImage, content.presentation?.comboImage]) { if (image !== '' && (typeof image !== 'string' || !/^\/(?:images\/|api\/media\/)[a-zA-Z0-9._/-]+$/.test(image) || image.includes('..'))) throw new Error('Choose a local or uploaded homepage image.'); }
  if (new Set(content.menu?.categories).size !== content.menu?.categories?.length) throw new Error('Category names must be unique.');
  if (!Array.isArray(content.mealOptions) || content.mealOptions.length > 8) throw new Error('Keep at most eight meal option groups.');
  const optionKeys = new Set<string>();
  for (const group of content.mealOptions) {
    if (!/^[a-z][a-z0-9-]{0,30}$/.test(group.key) || optionKeys.has(group.key) || !group.title?.trim() || !Array.isArray(group.choices) || group.choices.length < 1 || group.choices.length > 20) throw new Error('Meal option groups need unique keys, titles and 1–20 choices.');
    optionKeys.add(group.key);
    if (new Set(group.choices.map((choice) => choice.name)).size !== group.choices.length) throw new Error('Meal option names must be unique within a group.');
    for (const choice of group.choices) if (!choice.name?.trim() || !Number.isFinite(choice.price) || choice.price < 0 || choice.price > 500) throw new Error('Meal choices need a name and a price from 0 to 500 DH.');
  }
  const ids = new Set<string>();
  for (const product of content.products) {
    if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(product.id) || ids.has(product.id)) throw new Error('Products need unique URL slugs using lowercase letters, numbers and hyphens.');
    ids.add(product.id);
    if (!product.name?.trim() || product.name.length > 100 || !product.description?.trim() || product.description.length > 1000) throw new Error('Products need a name and description.');
    if (!Number.isFinite(product.price) || product.price < 0 || product.price > 10000) throw new Error('Product prices must be between 0 and 10,000 DH.');
    if (!/^\/(?:images\/|api\/media\/)[a-zA-Z0-9._/-]+$/.test(product.image) || product.image.includes('..')) throw new Error('Choose a local library image or upload a new image.');
    if (!content.menu?.categories?.includes(product.category)) throw new Error('Every product must belong to an existing category.');
  }
  function sameShape(template: unknown, candidate: unknown, key = 'content') {
    if (Array.isArray(template)) { if (!Array.isArray(candidate) || candidate.length > 500) throw new Error(`Invalid list: ${key}`); if (template.length && key !== 'content.products') candidate.forEach((item) => sameShape(template[0], item, key)); return; }
    if (template && typeof template === 'object') { if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw new Error(`Invalid section: ${key}`); for (const [name, entry] of Object.entries(template)) sameShape(entry, (candidate as Record<string, unknown>)[name], `${key}.${name}`); return; }
    if (typeof candidate !== typeof template || (typeof candidate === 'string' && candidate.length > 10000) || (typeof candidate === 'number' && (!Number.isFinite(candidate) || candidate < 0))) throw new Error(`Invalid value: ${key}`);
  }
  sameShape(initialContent, content);
  if (!content.menu.categories.includes('Everything') || content.menu.categories.length < 2) throw new Error('Keep the Everything category and at least one product category.');
}
