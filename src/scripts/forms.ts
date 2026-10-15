// Progressive lead forms, sticky bar and thank-you state (page.md §2 states, §7, §8; decisions §3, §6a, §15 #13).
// Without JS the forms are plain POSTs (303). All text goes in through createElement/append(string), never innerHTML.
// Analytics (Phase 4) hooks in at: onResult (tool used), submit() (form_start/error/lead_submitted), thankYou() (thank_you_view).
import { US_TICKERS, FX, fmtTer, fmtDate } from '../lib/data.ts';
import { buildPlan } from '../lib/plan.ts';
import { parseSelection, sanitizeUtm, validateEmail } from '../lib/selection.ts';
import type { Selection } from '../lib/selection.ts';

const h = (tag: string, cls = '', ...kids: (Node | string)[]) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.append(...kids);
  return e;
};
const q = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector(s) as T;

const MSG = {
  empty: 'Vyplňte e-mail, ať máme kam plán poslat.',
  invalid: 'Tenhle e-mail nevypadá úplně správně. Zkontrolujete ho?',
  server: 'Plán se nepodařilo odeslat. Zkuste to prosím za chvíli znovu.',
  rate: 'Příliš mnoho pokusů z jednoho místa. Zkuste to prosím za hodinu.',
};

const forms = [...document.querySelectorAll<HTMLFormElement>('.lead-form')];
const inline = q<HTMLFormElement>('#lead-inline');
const footer = q<HTMLFormElement>('#lead-footer');
const result = q('[data-result]');
const sticky = q('[data-sticky]');
const selectionOf = (f: HTMLFormElement) => parseSelection(new URLSearchParams(new FormData(f) as unknown as Record<string, string>), US_TICKERS);

// UTMs of this visit go into every form (the server allow-lists and caps them again).
const utm = sanitizeUtm(new URLSearchParams(location.search));
forms.forEach((f) => Object.entries(utm).forEach(([k, v]) => { (f.elements.namedItem(k) as HTMLInputElement).value = v; }));

// ---- Sticky bar: after the first result, while the inline form is off screen, until a lead is sent.
let inlineOnScreen = false;
let sent = false;
const syncSticky = () => { sticky.hidden = result.hidden || inlineOnScreen || sent; };
new IntersectionObserver(([e]) => { inlineOnScreen = e.isIntersecting; syncSticky(); }).observe(inline);
new MutationObserver(() => { syncSticky(); syncFooter(); }).observe(result, { attributes: true, attributeFilter: ['hidden'] }); // all picks removed
q('a', sticky).addEventListener('click', (e) => {
  e.preventDefault();
  inline.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  q<HTMLInputElement>('input[name="email"]', inline).focus({ preventScroll: true });
});

// ---- Final form says what the visitor picked. tool:result fires on every slider frame: write only on change.
const footH = q('[data-lead-h]', footer);
const footP = q('[data-lead-body]', footer);
const footDefault = [footH.textContent!, footP.textContent!];
const setText = (el: Element, v: string) => { if (el.textContent !== v) el.textContent = v; };
function onResult(sel: Selection) {
  setText(footH, 'Poslat plán e-mailem');
  setText(footP, `Pošleme vám plán pro ${sel.tickers.join(', ')}.`);
  syncSticky();
}
// Picks removed again (result block hidden): back to the S&P 500 fallback ask.
function syncFooter() {
  if (!result.hidden) return;
  setText(footH, footDefault[0]);
  setText(footP, footDefault[1]);
}
window.addEventListener('tool:result', ((e: CustomEvent<Selection>) => onResult(e.detail)) as EventListener);
// tool.ts runs first and may already have fired (ad B preselects VOO): catch up from the form fields it filled.
if (!result.hidden) onResult(selectionOf(inline));

// ---- Form states
const status = (f: HTMLFormElement) => q('[data-status]', f);
const emailOf = (f: HTMLFormElement) => q<HTMLInputElement>('input[name="email"]', f);

function showError(f: HTMLFormElement, text: string, field: boolean) {
  status(f).textContent = text;
  if (!field) return;
  emailOf(f).setAttribute('aria-invalid', 'true');
  emailOf(f).setAttribute('aria-describedby', status(f).id);
}

async function submit(f: HTMLFormElement) {
  const btn = q<HTMLButtonElement>('button[type="submit"]', f);
  const label = btn.textContent!;
  const fd = new FormData(f);
  const v = validateEmail(fd.get('email'));
  if (!v.ok) return showError(f, MSG[v.reason], true);

  btn.disabled = true;
  btn.textContent = 'Posíláme…';
  status(f).textContent = 'Posíláme…';
  try {
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(Object.fromEntries(fd)),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) return thankYou(f, v.email, () => { btn.disabled = false; btn.textContent = label; status(f).textContent = ''; });
    if (res.status === 429) showError(f, MSG.rate, false);
    else if (res.status === 400 && (data?.reason === 'invalid' || data?.reason === 'empty')) showError(f, MSG[data.reason as 'empty' | 'invalid'], true);
    else showError(f, MSG.server, false);
  } catch {
    showError(f, MSG.server, false); // network error or 10 s timeout
  }
  btn.disabled = false;
  btn.textContent = label;
}

// ---- Thank-you state: replaces the submitted form; the form stays in the DOM (hidden) for "Zadat znovu".
function thankYou(f: HTMLFormElement, email: string, reset: () => void) {
  const sel = selectionOf(f);
  const plan = buildPlan(sel, FX); // no picks → the fallback plan, same as the e-mail
  const rows = plan.groups.flatMap((g) => [...g.twins.map((t) => [t, g.kind === 'nearest' ? ' (jiný index)' : ''] as const),
    ...g.similar.map((t) => [t, ' (jiný index)'] as const)].map(([t, note]) => h('tr', '',
    h('td', '', g.picks.join(', ') + note), h('td', '', h('strong', 'ticker', t.xetra)), h('td', '', t.isin), h('td', 'num', fmtTer(t.terPct)),
    h('td', '', t.distribution === 'acc' ? 'akumulační' : 'distribuční'), h('td', '', `${t.issuer}${t.asOf ? `, ${fmtDate(t.asOf)}` : ''}`))));
  const th = ['Americké ETF', 'Evropské dvojče', 'ISIN', 'TER ročně', 'Dividendy', 'Zdroj, stav k'].map((c) => Object.assign(h('th', '', c), { scope: 'col' }));

  const heading = Object.assign(h(q('.lead-h', f).tagName.toLowerCase(), 'lead-h', `Hotovo. Plán je na cestě na ${email}.`), { tabIndex: -1 });
  const again = h('button', 'btn btn-quiet', 'Zadat znovu');
  const shareNote = h('span', '');
  shareNote.setAttribute('role', 'status');
  shareNote.setAttribute('aria-live', 'polite');
  const share = h('button', 'btn btn-quiet', 'Poslat odkaz');
  const box = h('div', 'thanks', heading,
    h('p', '', 'Měl by dorazit do pár minut. Když ho nevidíte, podívejte se do složky s hromadnou poštou nebo do spamu.'),
    h('p', '', 'Překlep v adrese? ', again),
    h('p', '', h('strong', '', 'Celá tabulka pro váš výběr, i s ISIN.')),
    h('div', 'table-wrap', h('table', '', h('thead', '', h('tr', '', ...th)), h('tbody', '', ...rows))),
    h('p', '', 'Daňový checklist a postup nákupu najdete v e-mailu.'),
    h('p', '', `Znáte někoho, kdo taky chtěl ${sel.tickers[0] ?? 'VOO'}? `, share, ' ', shareNote));

  again.type = share.type = 'button';
  again.addEventListener('click', () => { box.remove(); reset(); f.hidden = false; emailOf(f).focus(); });
  share.addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}?utm_source=share`; // no personal data, no selection
    try {
      if (navigator.share) await navigator.share({ url });
      else { await navigator.clipboard.writeText(url); shareNote.textContent = 'Odkaz zkopírován'; }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') shareNote.textContent = url; // clipboard blocked: show it to copy by hand
    }
  });

  f.hidden = true;
  f.after(box);
  heading.focus();
  sent = true;
  syncSticky();
}

forms.forEach((f) => {
  status(f).id = `${f.id}-status`;
  f.addEventListener('submit', (e) => { e.preventDefault(); void submit(f); });
  emailOf(f).addEventListener('input', () => {
    emailOf(f).removeAttribute('aria-invalid');
    emailOf(f).removeAttribute('aria-describedby');
    status(f).textContent = '';
  });
});
