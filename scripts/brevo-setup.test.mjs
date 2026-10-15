import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleLead } from '../api/lead.ts';
import { ATTRIBUTES } from './brevo-setup.mjs';

test('setup creates every attribute /api/lead writes; timestamps are text (a Brevo date keeps only the day)', async () => {
  const keys = new Set();
  const brevo = {
    getContact: async () => null,
    upsertContact: async (_email, attrs) => Object.keys(attrs).forEach((k) => keys.add(k)),
    sendEmail: async () => {},
  };
  const req = new Request('http://x/api/lead', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'email=a%40b.cz&t=VOO&newsletter=on&utm_source=instagram&utm_content=ad_a_1',
  });
  await handleLead(req, { brevo, now: () => new Date(), log: () => {}, siteUrl: 'http://x' });
  assert.ok(keys.has('PLAN_SENT_AT') && keys.has('NEWSLETTER'), 'both upserts ran');
  for (const k of keys) assert.ok(k in ATTRIBUTES, `missing in ATTRIBUTES: ${k}`);
  for (const k of ['PLAN_SENT_AT', 'NEWSLETTER_CONSENT_AT', 'LAST_REQUEST_AT']) assert.equal(ATTRIBUTES[k], 'text', k);
});
