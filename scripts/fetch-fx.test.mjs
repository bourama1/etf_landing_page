import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { updateFx } from './fetch-fx.mjs';

const tmp = () => join(mkdtempSync(join(tmpdir(), 'fx-')), 'fx.json');
const ok = (body) => async () => ({ ok: true, json: async () => body });

test('writes EUR rate and validFor from the ČNB response', async () => {
  const file = tmp();
  await updateFx({ file, today: '2026-10-15', fetch: ok({ rates: [
    { currencyCode: 'USD', rate: 22.1, validFor: '2026-10-14', amount: 1 },
    { currencyCode: 'EUR', rate: 24.355, validFor: '2026-10-14', amount: 1 }] }) });
  const fx = JSON.parse(readFileSync(file, 'utf8'));
  assert.equal(fx.rate, 24.355);
  assert.equal(fx.validFor, '2026-10-14');
  assert.equal(fx.retrieved_at, '2026-10-15');
});

test('keeps the last file when the API fails', async () => {
  const file = tmp();
  writeFileSync(file, '{"rate":24.365,"validFor":"2026-10-09"}');
  const r = await updateFx({ file, today: '2026-10-15', fetch: async () => { throw new Error('offline'); } });
  assert.equal(r.kept, true);
  assert.equal(JSON.parse(readFileSync(file, 'utf8')).rate, 24.365);
});

test('throws when the API fails and there is no file yet', async () => {
  await assert.rejects(updateFx({ file: tmp(), today: '2026-10-15', fetch: async () => ({ ok: false, status: 500 }) }));
});

test('rejects an implausible rate instead of writing it', async () => {
  const file = tmp();
  writeFileSync(file, '{"rate":24.365,"validFor":"2026-10-09"}');
  const r = await updateFx({ file, today: '2026-10-15', fetch: ok({ rates: [{ currencyCode: 'EUR', rate: 0, validFor: 'x', amount: 1 }] }) });
  assert.equal(r.kept, true);
});
