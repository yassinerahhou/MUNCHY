import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function load(file) {
  const source = await readFile(new URL(`../lib/${file}.ts`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { getBusinessStatus } = await load('business-hours');
const hours = ['MON–THU', '12:00–23:00', 'FRI–SUN', '12:00–00:00'];
const status = (date, schedule = hours) => getBusinessStatus(schedule, '25–40', new Date(date));
assert.equal(status('2026-11-16T11:59:00+01:00').isOpen, false);
assert.equal(status('2026-11-16T12:00:00+01:00').isOpen, true);
assert.equal(status('2026-11-16T23:00:00+01:00').isOpen, false);
assert.equal(status('2026-11-20T23:59:00+01:00').isOpen, true);
assert.equal(status('2026-11-21T00:00:00+01:00').isOpen, false);
assert.equal(status('2026-11-17T10:00:00+01:00', ['TUE', '10:00–11:00']).isOpen, true);
assert.equal(status('2026-11-18T01:00:00+01:00', ['TUE', '22:00–02:00']).isOpen, true);
assert.equal(status('2026-11-16T13:00:00+01:00', ['invalid', 'unknown']).isOpen, false);
console.log('PASS Casablanca hours, midnight boundaries, admin changes and overnight service');
const { csvCell } = await load('csv');
assert.equal(csvCell('=1+1'), '"\'=1+1"');
assert.equal(csvCell('+212600000001'), '"\'+212600000001"');
assert.equal(csvCell('Guest, "Casa"'), '"Guest, ""Casa"""');
assert.equal(csvCell(45), '"45"');
console.log('PASS spreadsheet-safe CSV escaping and numeric totals');
