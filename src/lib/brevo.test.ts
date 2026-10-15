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

test('a Brevo error carries its code and message, with any e-mail address masked', async () => {
  const fakeFetch = (async () => Response.json({ code: 'unauthorized', message: 'Key not found for a@b.cz' }, { status: 401 })) as typeof fetch;
  const brevo = brevoFromEnv({ BREVO_API_KEY: 'k' }, fakeFetch);
  await assert.rejects(brevo.getContact('a@b.cz'), (e: Error) => {
    assert.match(e.message, /401 unauthorized: Key not found for <email>/);
    assert.ok(!e.message.includes('a@b.cz'));
    return true;
  });
});

test('a URL-encoded address in a Brevo error is masked too', async () => {
  const fakeFetch = (async () => Response.json({ code: 'document_not_found', message: 'Contact a%40b.cz not found' }, { status: 400 })) as typeof fetch;
  await assert.rejects(brevoFromEnv({ BREVO_API_KEY: 'k' }, fakeFetch).upsertContact('a@b.cz', {}, []), (e: Error) => {
    assert.ok(!/a%40b\.cz|a@b\.cz/.test(e.message), e.message);
    return true;
  });
});
