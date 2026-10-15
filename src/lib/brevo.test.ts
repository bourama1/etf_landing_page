import { test } from 'node:test';
import assert from 'node:assert/strict';
import { brevoFromEnv } from './brevo.ts';
import { handleLead } from '../../api/lead.ts';

const post = () => new Request('http://x/api/lead', {
  method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: '{"email":"a@b.cz"}',
});

test('production without BREVO_API_KEY fails the lead (502) instead of a silent dry-run', async () => {
  const brevo = brevoFromEnv({ VERCEL_ENV: 'production' }, fetch);
  const res = await handleLead(post(), { brevo, now: () => new Date(), log: () => {}, siteUrl: 'http://x' });
  assert.equal(res.status, 502);
});

test('preview and local without a key stay in dry-run (200)', async () => {
  for (const env of [{ VERCEL_ENV: 'preview' }, {}]) {
    const brevo = brevoFromEnv(env, fetch);
    const res = await handleLead(post(), { brevo, now: () => new Date(), log: () => {}, siteUrl: 'http://x' });
    assert.equal(res.status, 200, JSON.stringify(env));
  }
});
