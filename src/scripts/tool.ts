// Behaviour of the three-step tool (page.md §2, decisions §4, §10). Markup hooks: comment at the top of Tool.astro.
// All text goes in through createElement/append(string), never innerHTML.
import { US_TICKERS, UCITS, BROKERS, FX, FX_BROKER, DATA_DATE, brokerShort, xetraTicker, plural, fmtCzk, fmtCzkRange,
  fmtNum, fmtPct, fmtTer, fmtDate } from '../lib/data.ts';
import { buildPlan } from '../lib/plan.ts';
import type { Group, Plan, Twin } from '../lib/plan.ts';
import { brokerFor, commissionEur, roundK } from '../lib/fees.ts';
import { parseSelection, toParams } from '../lib/selection.ts';
import type { Selection } from '../lib/selection.ts';

const q = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector(s) as T;
const h = (tag: string, cls = '', ...kids: (Node | string)[]) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.append(...kids);
  return e;
};
const link = (href: string, text: string) => Object.assign(h('a', '', text), { href }) as HTMLAnchorElement;
const setText = (sel: string, v: string) => document.querySelectorAll(sel).forEach((e) => { if (e.textContent !== v) e.textContent = v; });

const tool = q('.tool');
const stepA = q('#step-a');
const twinsBox = q('[data-twins]');
const expand = q<HTMLButtonElement>('[data-expand]');
const result = q('[data-result]');
const resultBody = q('[data-result-body]');
const live = [q('.result-line'), resultBody];
const chip = (t: string) => q<HTMLButtonElement>(`[data-ticker="${t}"]`, stepA);
const pressed = (t: string) => chip(t).getAttribute('aria-pressed') === 'true';
const val = (s: string) => q<HTMLInputElement>(s, tool).value;

// Result body: pairs (steps A/C), fee line and small print (step B).
const pairsBox = h('div');
const feeP = h('p');
const rSpan = h('span');
resultBody.append(pairsBox, feeP, h('p', 'src', 'Výnos ', rSpan, ' ročně je předpoklad, ne předpověď. Minulá výkonnost není zárukou budoucích výnosů. ',
  h('strong', '', 'Toto není doporučení.'), ' Zdroje: ', link('#jak-pocitame', 'Jak počítáme'), '.'));

const read = (): Selection => parseSelection(new URLSearchParams({
  t: US_TICKERS.filter(pressed).join(','), m: val('#in-m'), y: val('#in-y'), r: val('#in-r'),
  b: val('input[name="broker"]:checked'), d: val('input[name="dividends"]:checked'),
}), US_TICKERS);

const yearAgo = `${+DATA_DATE.slice(0, 4) - 1}${DATA_DATE.slice(4)}`; // same "new fund" rule as the e-mail
const dels = (picks: string[]) => picks.flatMap((t, i) => [i ? ', ' : '', h('del', 'ticker', t)]);

function twinRow(t: Twin, i: number) {
  const li = h('li', 'twin', h('strong', 'ticker', t.xetra), ` · ${t.name} · TER ${fmtTer(t.terPct)} ročně · `,
    t.distribution === 'acc' ? 'Akumulační' : 'Distribuční', ' · Zdroj: ', link(t.sourceUrl, t.issuer), t.asOf ? `, stav k ${fmtDate(t.asOf)}` : '');
  if (t.kidCs && t.kidUrl) li.append(' · ', link(t.kidUrl, 'KID v češtině'));
  if (t.inception > yearAgo) li.append(h('span', 'src', `Nový fond, obchoduje se od ${fmtDate(t.inception)}.`));
  li.style.setProperty('--i', String(Math.min(i, 5))); // stagger at most 6 rows
  return li;
}

function pairBlock(g: Group, enter: boolean) {
  const n = g.twins.length;
  const box = h('div', enter ? 'pair enter' : 'pair', h('p', 'us', ...dels(g.picks), ' ', h('span', 'blocked', 'U většiny brokerů nejde koupit')));
  if (g.kind === 'same') box.append(h('p', 'twin-h', `${n} ${plural(n, 'evropské ETF sleduje', 'evropská ETF sledují', 'evropských ETF sleduje')} stejný index ${g.indexName}.`));
  if (g.kind === 'nearest') box.append(
    h('p', '', `${g.picks.join(', ')} sleduje celý americký trh, včetně malých firem. Evropské ETF se stejným indexem jsme nenašli.`),
    h('p', '', `Nejbližší dostupné jsou fondy na ${g.twins[0]?.indexName ?? 'S&P 500'}: `, h('em', '', 'jiný index, jen velké firmy.')));
  if (g.kind === 'none') box.append(h('p', '', `${g.picks.join(', ')} nemá evropské dvojče. ETF se stejným indexem (${g.indexName}) jsme v Evropě nenašli.`));
  if (n) box.append(h('ul', 'twin-list', ...g.twins.map(twinRow)));
  if (g.similar.length) box.append(h('p', '', h('em', '', 'Podobné, jiný index (bez malých firem):')),
    h('ul', 'twin-list', ...g.similar.map((t, i) => twinRow(t, n + i))));
  return box;
}

function renderTwins(sel: Selection, plan: Plan, entered?: string) {
  const groups = sel.tickers.length ? plan.groups : [];
  const shown = groups.flatMap((g) => [...g.twins, ...g.similar]);
  const ex = shown.find((t) => t.london && t.london !== t.xetra);
  twinsBox.replaceChildren(...groups.map((g) => pairBlock(g, !!entered && g.picks.includes(entered))));
  if (shown.length) twinsBox.append(
    h('p', 'helper', 'Akumulační = dividendy reinvestuje. Distribuční = dividendy vyplácí.'),
    h('p', 'helper', 'Na každé burze má fond jiný ticker. ', ex ? `${ex.xetra} z Xetry je v Londýně ${ex.london}. ` : '',
      'Jistotu dává jen ISIN, ten najdete v plánu.'),
    h('p', 'helper', 'Pořadí není doporučení.'));
  if (pressed('other')) twinsBox.append(h('p', '', `Zatím porovnáváme těchto ${US_TICKERS.length} amerických ETF. U jiného fondu zjistěte na stránce vydavatele, jaký index sleduje, a hledejte evropské ETF se stejným indexem.`));

  const kind = { acc: ['akumulační fond', 'akumulační fondy', 'akumulačních fondů'], dist: ['distribuční fond', 'distribuční fondy', 'distribučních fondů'],
    both: ['fond', 'fondy', 'fondů'] }[sel.dividends] as [string, string, string];
  pairsBox.replaceChildren(...groups.flatMap((g) => {
    if (g.kind === 'none') return [h('p', '', ...dels(g.picks), ' nemá evropské dvojče.')];
    const n = g.twins.length;
    const out = [h('p', 'pair-line', ...dels(g.picks), ' → ', h('strong', 'ticker', g.twins.map((t) => t.xetra).join(' · ')),
      ` (${n} ${plural(n, ...kind)} na ${g.twins[0]?.indexName ?? g.indexName})`)];
    if (g.kind === 'same') out.push(h('p', '', `Stejný index ${g.indexName}, fond sídlí v Irsku a má KID, takže ho evropští brokeři můžou nabízet drobným investorům.`));
    return out;
  }));

  const n = new Set(groups.flatMap((g) => g.twins.map((t) => t.isin))).size;
  q('[data-sticky-summary]').replaceChildren(...dels(sel.tickers), n ? ` → ${n} ${plural(n, 'dvojče', 'dvojčata', 'dvojčat')}` : ' nemá evropské dvojče');
}

function renderFees(sel: Selection, plan: Plan) {
  const c = plan.fees.compare;
  const bank = fmtCzkRange(roundK(c.bankCostMin), roundK(c.bankCostMax));
  const etf = fmtCzk(roundK(c.etfCost));
  setText('[data-out="m"]', fmtCzk(sel.monthly));
  setText('[data-out="y"]', `${sel.years} ${plural(sel.years, 'rok', 'roky', 'let')}`);
  setText('[data-out="r"]', `${fmtPct(sel.returnPct)} ročně`);
  setText('[data-bank-cost]', bank);
  setText('[data-etf-cost]', etf);

  const ter = UCITS.find((f) => (xetraTicker(f) ?? f.ticker) === plan.fees.terTicker)!;
  setText('[data-ter-ticker]', plan.fees.terTicker);
  setText('[data-ter-issuer]', ter.issuer);
  setText('[data-ter-asof]', ter.sources.default.as_of ? fmtDate(ter.sources.default.as_of) : '');
  const b = sel.broker === 'unknown' ? FX_BROKER : BROKERS.find((x) => x.id === sel.broker)!;
  setText('[data-broker-source]', `ceník ${brokerShort(b)}${b.as_of ? `, stav k ${fmtDate(b.as_of)}` : ''}`);

  const notes: Record<string, string> = {
    unknown: `Počítáme s nejvyšší zveřejněnou přirážkou za směnu, ${fmtPct(brokerFor('unknown', BROKERS).fx_pct!)}.`,
    fio: 'Fio nezveřejňuje kurzovou přirážku, počítáme jen poplatek za obchod.',
    cs: 'Ceník neuvádí kurzovou přirážku, počítáme jen poplatek za obchod a úschovu.',
  };
  let note = notes[sel.broker] ?? '';
  if (c.fixedFeePct) {
    const eur = commissionEur(brokerFor(sel.broker, BROKERS).commission, sel.monthly / FX.rate);
    note += ` Při ${fmtCzk(sel.monthly)} měsíčně je pevný poplatek ${fmtNum(Math.round(eur * 100) / 100)} EUR asi ${fmtPct(Math.round(c.fixedFeePct * 10) / 10)} z každého nákupu. V procentech vyjde levněji méně častý a větší nákup. Přepočet kurzem ČNB k ${fmtDate(FX.validFor)}, broker může použít jiný.`;
  }
  setText('[data-broker-note]', note.trim());

  feeP.replaceChildren(`Při ${fmtCzk(sel.monthly)} měsíčně a ${sel.years} ${plural(sel.years, 'roce', 'letech', 'letech')} vás poplatky v ETF připraví asi o `,
    h('strong', 'num', etf), ', v bankovním akciovém fondu o ', h('strong', 'num', bank), '.');
  if (rSpan.textContent !== fmtPct(sel.returnPct)) rSpan.textContent = fmtPct(sel.returnPct);
}

function update(all: boolean, entered?: string) {
  const sel = read();
  const plan = buildPlan(sel, FX);
  if (all) renderTwins(sel, plan, entered);
  renderFees(sel, plan);
  const params = toParams(sel);
  document.querySelectorAll<HTMLFormElement>('.lead-form').forEach((f) =>
    params.forEach((v, k) => { (f.elements.namedItem(k) as HTMLInputElement).value = v; }));
  result.hidden = !sel.tickers.length;
  if (sel.tickers.length) window.dispatchEvent(new CustomEvent('tool:result', { detail: sel }));
}

stepA.addEventListener('click', (e) => {
  const b = (e.target as Element).closest<HTMLButtonElement>('button[data-ticker]');
  if (!b) return;
  const on = b.getAttribute('aria-pressed') !== 'true';
  b.setAttribute('aria-pressed', String(on));
  update(true, on && b.dataset.ticker !== 'other' ? b.dataset.ticker : undefined);
});

// Sliders: numbers follow the thumb (rAF), but screen readers hear the result only on `change`.
let raf = 0;
tool.addEventListener('input', (e) => {
  if ((e.target as HTMLInputElement).type !== 'range') return;
  live.forEach((l) => l.setAttribute('aria-live', 'off'));
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => update(false));
});
tool.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.closest('.lead-form')) return;
  cancelAnimationFrame(raf);
  live.forEach((l) => l.setAttribute('aria-live', 'polite'));
  update(t.name === 'dividends');
});

tool.addEventListener('click', (e) => {
  const next = (e.target as Element).closest<HTMLElement>('[data-next]');
  if (next) q(`#step-${next.dataset.next}-h`).focus();
});
document.addEventListener('click', (e) => {
  if ((e.target as Element).closest('a[href="#jak-pocitame"]')) q<HTMLDetailsElement>('#jak-pocitame').open = true;
});
const retBtn = q<HTMLButtonElement>('[data-ret]');
retBtn.addEventListener('click', () => {
  const open = retBtn.getAttribute('aria-expanded') !== 'true';
  retBtn.setAttribute('aria-expanded', String(open));
  q('#ret-panel').hidden = !open;
  if (open) q('#in-r').focus();
});
expand.addEventListener('click', () => {
  stepA.classList.add('open');
  chip(US_TICKERS[0]).focus();
});

// Ad B lands on the fee calculator with VOO picked (decisions §4); CSS collapses Step A from the first paint.
if (document.documentElement.dataset.variant === 'b') chip('VOO').setAttribute('aria-pressed', 'true');
update(true);
