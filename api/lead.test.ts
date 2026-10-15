import test from 'node:test';
import assert from 'node:assert/strict';
import { handleLead } from './lead.ts';

const fake = (existing: Record<string, unknown> | null = null, fail: Partial<Record<'get' | 'upsert' | 'send', boolean>> = {}) => {
  const calls: string[] = [];
  const upserts: any[] = [];
  return {
    calls,
    upserts,
    brevo: {
      async getContact() { calls.push('get'); if (fail.get) throw new Error('x'); return existing && { attributes: existing }; },
      async upsertContact(email: string, attributes: object, lists: number[]) { calls.push('upsert'); if (fail.upsert) throw new Error('x'); upserts.push({ email, attributes, lists }); },
      async sendEmail() { calls.push('send'); if (fail.send) throw new Error('x'); },
    },
  };
};
const now = new Date('2026-10-15T10:00:00Z');
const json = (body: object) => new Request('http://x/api/lead', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(body) });
const form = (body: string) => new Request('http://x/api/lead', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
const deps = (f: ReturnType<typeof fake>) => ({ brevo: f.brevo, now: () => now, log: () => {}, siteUrl: 'https://example.cz' });

test('new address: upsert, send, then PLAN_SENT_AT; 200 {ok:true}', async () => {
  const f = fake();
  const res = await handleLead(json({ email: 'a@b.cz', t: 'VOO', utm_content: 'ad_b_fees' }), deps(f));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.deepEqual(f.calls, ['get', 'upsert', 'send', 'upsert']);
  assert.equal(f.upserts[0].attributes.AD_VARIANT, 'b');
  assert.equal(f.upserts[1].attributes.PLAN_SENT_AT, now.toISOString());
});
test('same address within 24 h: attributes updated, no e-mail, still 200', async () => {
  const f = fake({ PLAN_SENT_AT: '2026-10-15T01:00:00Z' });
  const res = await handleLead(json({ email: 'a@b.cz' }), deps(f));
  assert.equal(res.status, 200);
  assert.ok(!f.calls.includes('send'));
  assert.ok(f.calls.includes('upsert'));
});
test('after 24 h a new plan is sent', async () => {
  const f = fake({ PLAN_SENT_AT: '2026-10-14T09:59:00Z' });
  await handleLead(json({ email: 'a@b.cz' }), deps(f));
  assert.ok(f.calls.includes('send'));
});
test('honeypot: fake success, nothing stored or sent, logged', async () => {
  const f = fake();
  const logs: string[] = [];
  const res = await handleLead(json({ email: 'a@b.cz', fld_q8: 'x' }), { ...deps(f), log: (m) => logs.push(m) });
  assert.equal(res.status, 200);
  assert.deepEqual(f.calls, []);
  assert.equal(logs.length, 1);
});
test('invalid e-mail: 400 with reason, nothing called', async () => {
  const f = fake();
  const res = await handleLead(json({ email: 'nope' }), deps(f));
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { ok: false, reason: 'invalid' });
  assert.deepEqual(f.calls, []);
});
test('hostile hidden fields never reach Brevo unfiltered', async () => {
  const f = fake();
  await handleLead(json({ email: 'a@b.cz', t: '<a href="x">Váš účet</a>,VOO', m: '1e9', b: 'evil' }), deps(f));
  const a = f.upserts[0].attributes;
  assert.equal(a.TICKERS, 'VOO');
  assert.equal(a.MONTHLY, 30000);
  assert.equal(a.BROKER, 'unknown');
});
test('newsletter: ticked adds list + consent time; unticked never clears earlier consent', async () => {
  const f = fake();
  await handleLead(json({ email: 'a@b.cz', newsletter: 'on' }), deps(f));
  assert.equal(f.upserts[0].attributes.NEWSLETTER, true);
  assert.equal(f.upserts[0].attributes.NEWSLETTER_CONSENT_AT, now.toISOString());
  assert.equal(f.upserts[0].attributes.CONSENT_TEXT_V, 1);
  const g = fake({ NEWSLETTER: true });
  await handleLead(json({ email: 'a@b.cz' }), deps(g));
  assert.equal('NEWSLETTER' in g.upserts[0].attributes, false);
  assert.equal('NEWSLETTER_CONSENT_AT' in g.upserts[0].attributes, false);
});
test('Brevo failure on get, upsert or send: 502 server', async () => {
  for (const which of ['get', 'upsert', 'send'] as const) {
    const res = await handleLead(json({ email: 'a@b.cz' }), deps(fake(null, { [which]: true })));
    assert.equal(res.status, 502);
    assert.deepEqual(await res.json(), { ok: false, reason: 'server' });
  }
});
test('failure of the final PLAN_SENT_AT update is logged, still 200', async () => {
  const f = fake();
  let n = 0;
  const brevo = { ...f.brevo, async upsertContact(...a: [string, object, number[]]) { if (++n === 2) throw new Error('x'); return f.brevo.upsertContact(...a); } };
  const logs: string[] = [];
  const res = await handleLead(json({ email: 'a@b.cz' }), { ...deps(f), brevo, log: (m) => logs.push(m) });
  assert.equal(res.status, 200);
  assert.deepEqual(logs, ['plan_sent_at_update_failed']);
});
test('logs never contain the e-mail address', async () => {
  const logs: string[] = [];
  await handleLead(json({ email: 'secret@b.cz' }), { ...deps(fake(null, { send: true })), log: (m, d) => logs.push(m + JSON.stringify(d ?? {})) });
  assert.ok(logs.length > 0);
  assert.ok(!logs.join('').includes('secret'));
});
test('no-JS form POST: 303 to /dekujeme/ or /chyba-formulare/', async () => {
  const ok = await handleLead(form('email=a%40b.cz'), deps(fake()));
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get('location'), '/dekujeme/');
  const bad = await handleLead(form('email=x'), deps(fake()));
  assert.equal(bad.status, 303);
  assert.equal(bad.headers.get('location'), '/chyba-formulare/');
  const down = await handleLead(form('email=a%40b.cz'), deps(fake(null, { send: true })));
  assert.equal(down.headers.get('location'), '/chyba-formulare/');
});
test('rejects non-POST (405), malformed JSON (400) and bodies over 10 kB (413)', async () => {
  assert.equal((await handleLead(new Request('http://x/api/lead'), deps(fake()))).status, 405);
  assert.equal((await handleLead(json({ email: 'a@b.cz', pad: 'x'.repeat(11000) }), deps(fake()))).status, 413);
  const bad = await handleLead(new Request('http://x/api/lead', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: '{nope' }), deps(fake()));
  assert.equal(bad.status, 400);
});
test('failure cause is logged without the e-mail address', async () => {
  const f = fake();
  const logs: string[] = [];
  const brevo = { ...f.brevo, async upsertContact() { throw new Error('brevo 400 /contacts'); } };
  await handleLead(json({ email: 'secret@b.cz' }), { ...deps(f), brevo, log: (m, d) => logs.push(m + JSON.stringify(d ?? {})) });
  assert.ok(logs.join('').includes('brevo 400 /contacts'));
  assert.ok(!logs.join('').includes('secret'));
});
test('list IDs: plan list always, newsletter list only when ticked and numeric', async () => {
  const lists = async (body: object, env: Record<string, string>) => {
    const f = fake();
    await handleLead(json(body), deps(f), env);
    return f.upserts[0].lists;
  };
  assert.deepEqual(await lists({ email: 'a@b.cz', newsletter: 'on' }, { BREVO_PLAN_LIST_ID: '3', BREVO_NEWSLETTER_LIST_ID: 'x' }), [3]);
  assert.deepEqual(await lists({ email: 'a@b.cz', newsletter: 'on' }, { BREVO_PLAN_LIST_ID: '3', BREVO_NEWSLETTER_LIST_ID: '4' }), [3, 4]);
  assert.deepEqual(await lists({ email: 'a@b.cz' }, { BREVO_PLAN_LIST_ID: '3', BREVO_NEWSLETTER_LIST_ID: '4' }), [3]);
});
