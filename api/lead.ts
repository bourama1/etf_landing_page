// The only endpoint that takes internet input and sends e-mail in our name (decisions §6a, §15 #10-13).
import { US_TICKERS, FX } from '../src/lib/data.ts';
import { parseSelection, validateEmail, sanitizeUtm, adVariant } from '../src/lib/selection.ts';
import { buildPlan } from '../src/lib/plan.ts';
import { renderEmail } from '../src/lib/email.ts';
import { brevoFromEnv } from '../src/lib/brevo.ts';
import type { Brevo } from '../src/lib/brevo.ts';

type Deps = { brevo: Brevo; now: () => Date; log: (msg: string, data?: object) => void; siteUrl: string };
type Env = Record<string, string | undefined>;

const MAX_BYTES = 10_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const listId = (v: string | undefined) => (Number.isInteger(Number(v)) && v?.trim() ? [Number(v)] : []);

export async function handleLead(req: Request, deps: Deps, env: Env = {}): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  const { brevo, now, log, siteUrl } = deps;
  const wantsJson = (req.headers.get('accept') ?? '').includes('application/json');
  const fail = (status: number, reason: 'invalid' | 'server') =>
    wantsJson ? Response.json({ ok: false, reason }, { status }) : redirect('/chyba-formulare/');
  const ok = () => (wantsJson ? Response.json({ ok: true }) : redirect('/dekujeme/'));

  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_BYTES) return fail(413, 'invalid');

  const body = new URLSearchParams();
  if ((req.headers.get('content-type') ?? '').includes('application/json')) {
    let data: unknown;
    try { data = JSON.parse(text); } catch { return fail(400, 'invalid'); }
    if (data === null || typeof data !== 'object' || Array.isArray(data)) return fail(400, 'invalid');
    for (const [k, v] of Object.entries(data)) if (typeof v === 'string') body.set(k, v);
  } else {
    for (const [k, v] of new URLSearchParams(text)) body.set(k, v);
  }

  if ((body.get('fld_q8') ?? '') !== '') { log('honeypot'); return ok(); }

  const e = validateEmail(body.get('email'));
  if (!e.ok) return fail(400, 'invalid');
  const email = e.email;

  const sel = parseSelection(body, US_TICKERS);
  const utm = sanitizeUtm(body);
  const stamp = now().toISOString();
  const ticked = ['on', 'true'].includes(body.get('newsletter') ?? '');
  const attributes: Record<string, unknown> = {
    TICKERS: sel.tickers.join(','),
    MONTHLY: sel.monthly,
    YEARS: sel.years,
    RETURN_PCT: sel.returnPct,
    BROKER: sel.broker,
    DIVIDENDS: sel.dividends,
    AD_VARIANT: adVariant(utm.utm_content),
    UTM_SOURCE: utm.utm_source,
    UTM_MEDIUM: utm.utm_medium,
    UTM_CAMPAIGN: utm.utm_campaign,
    UTM_CONTENT: utm.utm_content,
    UTM_TERM: utm.utm_term,
    LAST_REQUEST_AT: stamp,
    // An unticked box leaves these keys out so an earlier consent is never cleared.
    ...(ticked ? { NEWSLETTER: true, NEWSLETTER_CONSENT_AT: stamp, CONSENT_TEXT_V: 1 } : {}),
  };
  const lists = [...listId(env.BREVO_PLAN_LIST_ID), ...(ticked ? listId(env.BREVO_NEWSLETTER_LIST_ID) : [])];

  try {
    const existing = await brevo.getContact(email);
    const sentAt = Date.parse(String(existing?.attributes.PLAN_SENT_AT ?? ''));
    const recent = Number.isFinite(sentAt) && now().getTime() - sentAt < DAY_MS;

    await brevo.upsertContact(email, attributes, lists);
    if (recent) return ok();

    const msg = renderEmail(buildPlan(sel, FX), sel, siteUrl, now());
    await brevo.sendEmail({ to: email, ...msg });
  } catch {
    log('brevo_error');
    return fail(502, 'server');
  }
  try {
    await brevo.upsertContact(email, { PLAN_SENT_AT: stamp }, lists);
  } catch {
    log('plan_sent_at_update_failed');
  }
  return ok();
}

const redirect = (to: string) => new Response(null, { status: 303, headers: { location: to } });

export async function POST(request: Request): Promise<Response> {
  const log = (m: string, d?: object) => console.log(JSON.stringify({ m, ...d }));
  let siteUrl = process.env.SITE_URL ?? 'http://localhost:4321';
  try { new URL(siteUrl); } catch { log('invalid_site_url'); siteUrl = 'http://localhost:4321'; }
  return handleLead(request, { brevo: brevoFromEnv(process.env, fetch), now: () => new Date(), log, siteUrl }, process.env);
}
