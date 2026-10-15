// One-off Brevo account setup (decisions §6a): the contact attributes /api/lead writes, and the two lists.
// Run: node --env-file=.env.local scripts/brevo-setup.mjs   (BREVO_API_KEY in the gitignored .env.local)
// Prints the list IDs for BREVO_PLAN_LIST_ID / BREVO_NEWSLETTER_LIST_ID. Run once: a re-run skips existing attributes but creates a new folder and new lists.
import { pathToFileURL } from 'node:url';

// Timestamps are text: a Brevo `date` attribute stores only YYYY-MM-DD, which would break the 24 h dedupe on PLAN_SENT_AT.
export const ATTRIBUTES = {
  TICKERS: 'text', BROKER: 'text', DIVIDENDS: 'text', AD_VARIANT: 'text',
  UTM_SOURCE: 'text', UTM_MEDIUM: 'text', UTM_CAMPAIGN: 'text', UTM_CONTENT: 'text', UTM_TERM: 'text',
  LAST_REQUEST_AT: 'text', NEWSLETTER_CONSENT_AT: 'text', PLAN_SENT_AT: 'text',
  MONTHLY: 'float', YEARS: 'float', RETURN_PCT: 'float', CONSENT_TEXT_V: 'float',
  NEWSLETTER: 'boolean',
};

export async function setup({ key, fetch = globalThis.fetch, log = console.log }) {
  const api = async (method, path, body) => {
    const res = await fetch(`https://api.brevo.com/v3${path}`, {
      method, headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
      body: body && JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  };
  for (const [name, type] of Object.entries(ATTRIBUTES)) {
    const r = await api('POST', `/contacts/attributes/normal/${name}`, { type });
    if (r.ok) log(`attribute ${name} (${type}) created`);
    else if (r.status === 400 && /exist/i.test(r.data.message ?? '')) log(`attribute ${name} exists, skipped`);
    else throw new Error(`attribute ${name}: ${r.status} ${r.data.message ?? ''}`);
  }
  const folder = await api('POST', '/contacts/folders', { name: 'ETF Dvojče' });
  if (!folder.ok) throw new Error(`folder: ${folder.status} ${folder.data.message ?? ''}`);
  const ids = {};
  for (const [env, name] of [['BREVO_PLAN_LIST_ID', 'Plán'], ['BREVO_NEWSLETTER_LIST_ID', 'Novinky']]) {
    const list = await api('POST', '/contacts/lists', { name, folderId: folder.data.id });
    if (!list.ok) throw new Error(`list ${name}: ${list.status} ${list.data.message ?? ''}`);
    ids[env] = list.data.id;
  }
  log(ids);
  return ids;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.BREVO_API_KEY) throw new Error('BREVO_API_KEY missing (use --env-file=.env.local)');
  await setup({ key: process.env.BREVO_API_KEY });
}
