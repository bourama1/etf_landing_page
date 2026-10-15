// Plan e-mail from content/email.md (approved copy, Top + 1-5 + Footer). One block list renders to HTML and plain text.
import { BANKS, BROKERS, fmtCzk, fmtDate, fmtNum, fmtPct, fmtTer } from './data.ts';
import { roundK } from './fees.ts';
import type { Plan } from './plan.ts';
import { toParams } from './selection.ts';
import type { Selection } from './selection.ts';

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// `mail` marks blocks that only make sense in the e-mail itself (greeting, link to /plan, footer); /plan drops them.
export type Block = (
  | { k: 'h'; s: string } | { k: 'h3'; s: string } | { k: 'p'; s: string } | { k: 'hr' } | { k: 'cta'; s: string; href: string }
  | { k: 'list'; items: string[]; mark: '•' | '☐' | '1' } | { k: 'table'; head: string[]; rows: string[][] }) & { mail?: true };

const LINK = /\[([^\]]+)\]\((https?:[^)\s]+)\)/g;
const A = 'color:#14532d;text-decoration:underline';
// Inline markup: **bold** and [label](url). Escaping happens here, once, for everything that reaches the HTML.
const inline = (s: string) =>
  esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(LINK, `<a href="$2" style="${A}">$1</a>`);
const plain = (s: string) => s.replace(/\*\*/g, '').replace(LINK, '$1 ($2)');

const range = (a: number, b: number) => (a === b ? fmtCzk(a) : `${fmtNum(a)}–${fmtCzk(b)}`);
const pctRange = (a: number, b: number) => (a === b ? fmtPct(a) : `${fmtNum(a)}–${fmtPct(b)}`);
const pragueDate = (d: Date) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', day: 'numeric', month: 'numeric', year: 'numeric' })
    .formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.day}. ${p.month}. ${p.year}`;
};

function subjectFor(plan: Plan, sel: Selection) {
  if (plan.fallback) return 'Váš ETF plán pro S&P 500';
  return sel.tickers.length === 1 ? `Váš ETF plán: ${sel.tickers[0]} a jeho evropská dvojčata`
    : `Váš ETF plán: ${sel.tickers.join(', ')} a jejich evropská dvojčata`;
}

function groupBlocks(plan: Plan): Block[] {
  const yearAgo = `${+plan.dataDate.slice(0, 4) - 1}${plan.dataDate.slice(4)}`;
  return plan.groups.flatMap((g): Block[] => {
    const label = g.picks.join(', ');
    if (g.kind === 'none') return [{ k: 'p', s: `**${label}** nemá evropské dvojče. ETF na index ${g.indexName} jsme v Evropě nenašli.` }];
    const head: Block[] = g.kind === 'same'
      ? [{ k: 'h3', s: `${label} (${g.indexName}) → evropská ETF se stejným indexem` }]
      : [{ k: 'h3', s: `${label} (${g.indexName})` },
        { k: 'p', s: `Evropské ETF se stejným indexem (${g.indexName}) jsme nenašli. Nejbližší dostupné jsou fondy na ${g.twins[0]?.indexName ?? 'S&P 500'}. Jde o jiný index, jen velké firmy.` }];
    const out: Block[] = [...head, {
      k: 'table', head: ['Fond', 'ISIN', 'Ticker', 'TER ročně', 'Dividendy', 'Měna fondu', 'Zdroj, stav k'],
      rows: g.twins.map((t) => [t.name, t.isin, `${t.xetra} (Xetra, EUR)${t.london ? ` · ${t.london} (Londýn, USD)` : ''}`, fmtTer(t.terPct),
        t.distribution === 'acc' ? 'akumulační' : 'distribuční', t.fundCurrency,
        `[${t.issuer}${t.asOf ? `, ${fmtDate(t.asOf)}` : ''}](${t.sourceUrl})`]),
    }, { k: 'list', mark: '•', items: [
      'Ticker se liší podle burzy, ISIN je pro fond jen jeden. U brokera hledejte podle ISIN.',
      'Měna fondu je měna, ve které fond počítá hodnotu. Na Xetře ho koupíte v eurech, v Londýně v dolarech.'] }];
    const tickers = g.twins.map((t) => t.xetra).join(', ');
    const young = g.twins.length > 0 && g.twins.every((t) => t.inception > yearAgo);
    const one = g.twins.length === 1;
    if (young || g.similar.length) out.push({ k: 'p', s: `${tickers} ${one ? 'sleduje' : 'sledují'} stejný index ${g.indexName}.${young
      ? ` ${one ? 'Je nový, obchoduje se' : 'Jsou nové, obchodují se'} od ${fmtDate(g.twins.map((t) => t.inception).sort()[0])}.` : ''}` });
    if (g.similar.length) out.push({ k: 'p', s: `Podobné, ale bez malých firem: ${g.similar.map((t) => t.xetra).join(', ')} (index ${g.similar[0].indexName}).` });
    return out;
  });
}

function feeBlocks(plan: Plan, sel: Selection): Block[] {
  const f = plan.fees;
  const banks = BANKS.filter((b) => b.ongoing_pct != null);
  const entry = banks.map((b) => b.entry_max_pct), ongoing = banks.map((b) => b.ongoing_pct!);
  const fio = BROKERS.find((b) => b.id === 'fio')!;
  const tier = fio.commission.tiers_eur![0];
  const eg = 125; // example purchase in EUR, as in the approved copy and content/calc-examples.mjs
  const broker = sel.broker === 'unknown'
    ? `počítáme s nejvyšší zveřejněnou přirážkou za směnu, ${fmtPct(BROKERS.reduce((m, b) => Math.max(m, b.fx_pct ?? 0), 0))}`
    : `u ${f.brokerName} (${f.brokerAsOf ? `ceník k ${fmtDate(f.brokerAsOf)}` : 'datum ceníku nezjištěno'})`;
  const cs = BANKS.find((b) => b.inducements)?.inducements?.equity_eam_cr_pct_range[1];
  return [
    { k: 'p', s: `Váš výpočet: **${fmtCzk(sel.monthly)} měsíčně, ${sel.years} let, výnos ${fmtPct(sel.returnPct)} ročně** (předpoklad, ne předpověď), nakupujete ${sel.broker === 'unknown' ? 'u „nevím“' : `u ${f.brokerName}`}.` },
    { k: 'table', head: ['Po letech', 'Vloženo', 'Bankovní akciový fond', 'Indexové ETF', 'Rozdíl'],
      rows: f.rows.map((r) => {
        const lo = roundK(r.bankMin), hi = roundK(r.bankMax), e = roundK(r.etf);
        return [String(r.year), fmtCzk(r.paidIn), range(lo, hi), fmtCzk(e), range(e - hi, e - lo)];
      }) },
    { k: 'p', s: 'Co je v čísle:' },
    { k: 'list', mark: '•', items: [
      `**Bankovní fond:** vstupní poplatek ${pctRange(Math.min(...entry), Math.max(...entry))} z každé platby (maximum podle KID, banka může dát slevu) a průběžné náklady ${pctRange(Math.min(...ongoing), Math.max(...ongoing))} ročně. Zdroj: ${banks.map((b) => `KID ${b.name} (${fmtDate(b.kid_date!)})`).join(', ')}.`,
      `**ETF:** TER ${fmtTer(f.terPct)} ročně, poplatek za obchod a směna měny: ${broker}.`,
      ...(sel.broker === 'fio' ? ['Fio kurzovou přirážku nezveřejňuje, v čísle je jen poplatek za obchod.'] : []),
      'Nepočítáme transakční náklady fondů, rozpětí cen na burze ani daně.'] },
    { k: 'p', s: `Na co si dát pozor u malých částek: pevný poplatek za obchod může být v procentech vyšší než vstupní poplatek bankovního fondu. Třeba u Fio stojí nákup na Xetře do ${fmtNum(tier.up_to_eur!)} EUR ${fmtNum(tier.fee_eur!)} EUR, při nákupu za ${eg} EUR je to ${fmtPct((tier.fee_eur! / eg) * 100)}. Zdroj: Fio, Ceník základních služeb (od ${fmtDate(fio.as_of!)}).` },
    { k: 'p', s: `Kolik si může vzít banka: Česká spořitelna uvádí, že od správců akciových fondů dostává za jejich distribuci až ${fmtPct(cs!)} ročně z majetku ve fondu. Platí to z ročního poplatku fondu. Zdroj: ČS, Základní informace o poskytování investičních služeb.` },
  ];
}

const tickersOf = (plan: Plan, d: 'acc' | 'dist') =>
  [...new Set(plan.groups.flatMap((g) => g.twins.filter((t) => t.distribution === d).map((t) => t.xetra)))].join(', ');
const withList = (s: string, l: string) => (l ? `${s} (${l})` : s);

export function blocks(plan: Plan, sel: Selection, siteUrl: string, sentOn: Date): Block[] {
  const picks = plan.groups.flatMap((g) => g.picks).join(', ');
  const link = `${siteUrl}/plan?${toParams(sel).toString().replaceAll('%2C', ',')}&utm_source=email`;
  return [
    { k: 'p', s: 'Dobrý den,', mail: true },
    { k: 'p', s: `tady je plán, který jste si vyžádali na ETF Dvojče. Data jsou k ${fmtDate(plan.dataDate)}, u každého čísla najdete zdroj.` },
    { k: 'cta', s: 'Otevřít plán online', href: link, mail: true },
    { k: 'p', s: 'Obsah: 1. Vaše dvojčata · 2. Akumulační, nebo distribuční? · 3. Poplatky v korunách · 4. Daně z ETF v Česku 2026 · 5. Jak fond koupit' },
    { k: 'h', s: '1. Vaše dvojčata' }, ...groupBlocks(plan),
    { k: 'p', s: 'Toto není doporučení. Který fond koupíte a jestli vůbec, je na vás.' },
    { k: 'h', s: '2. Akumulační, nebo distribuční? (pro rezidenta ČR)' },
    { k: 'p', s: 'Platí pro americké dividendy uvnitř fondu na S&P 500 a pro investora, kterému broker uplatňuje smlouvu ČR–USA.' },
    { k: 'table', head: ['', withList('Americké ETF', picks), withList('Irské akumulační', tickersOf(plan, 'acc')), withList('Irské distribuční', tickersOf(plan, 'dist'))], rows: [
      ['Daň v USA z dividend', '15 % sraženo vám', '15 % sraženo fondu', '15 % sraženo fondu'],
      ['Daň v ČR', '15 %, započtete daň z USA, doplácíte 0', 'nic, dokud neprodáte', '15 % z vyplacené dividendy, nic se nezapočítává'],
      ['Celkem z americké dividendy', 'asi 15 %', 'asi 15 %', 'asi 15 % + 15 % ze zbytku'],
      ['Papírování každý rok', 'dividendy do přiznání (viz část 4)', 'žádné, dokud držíte', 'dividendy do přiznání'],
      ['Americká dědická daň', 'může se týkat (majetek v USA nad 60 000 USD)', 'netýká se', 'netýká se']] },
    { k: 'p', s: 'Shrnutí: na dani z dividend irský fond neušetří. Akumulační verze ale nic nevyplácí, takže nemáte co přiznávat, a irský fond se netýká americké dědické daně. Distribuční irský fond vychází daňově nejhůř ze všech tří.' },
    { k: 'p', s: 'Zdroje: smlouva ČR–USA, čl. 10 odst. 2 b) a 3 (irs.gov); smlouva Irsko–USA, čl. 10 odst. 2 b) (irs.gov); Irish Revenue, Tax and Duty Manual 27-01A-02, §4.2.3 (leden 2026); zákon o daních z příjmů § 8, § 16a, § 38f (znění k 1. 8. 2026); IRS, Instructions for Form 706-NA (září 2025); IRS, Some nonresidents with U.S. assets must file estate tax returns (27. 6. 2026). Informativní, nejde o daňové poradenství.' },
    { k: 'h', s: '3. Poplatky v korunách' }, ...feeBlocks(plan, sel),
    { k: 'h', s: '4. Daně z ETF v Česku 2026 (checklist)' },
    { k: 'p', s: 'Informativní, nejde o daňové poradenství. Platí pro fyzické osoby, které ETF nedrží v obchodním majetku.' },
    { k: 'list', mark: '☐', items: [
      '**Časový test.** Zisk z prodeje je osvobozený, když mezi nákupem a prodejem uplynou víc než 3 roky. Počítá se zvlášť pro každý nákup, takže u pravidelného investování má každá měsíční platba své datum. Zdroj: § 4 odst. 1 písm. u) ZDP.',
      '**Od 1. 1. 2026 bez stropu.** Limit 40 milionů Kč pro časový test se u cenných papírů ruší. Zůstává jen u kryptoaktiv. Zdroj: Finanční správa, Daňové novinky pro rok 2026 (5. 1. 2026); § 4 odst. 3 ZDP.',
      '**Hodnotový test.** Když za celý rok prodáte cenné papíry nejvýš za 100 000 Kč, je příjem osvobozený. Počítá se celá částka z prodeje, ne zisk. Když limit přesáhnete, tento test vám nepomůže pro žádný z prodejů. Zdroj: § 4 odst. 1 písm. t) ZDP.',
      '**Dividendy z distribučního fondu** se daní v daňovém přiznání. Můžete je dát do samostatného základu daně se sazbou 15 % (Příloha č. 4), pak tam ale musí jít všechny zahraniční dividendy za daný rok. Zdroj: § 8 odst. 4 a 8 a § 16a ZDP; Příloha č. 4 k přiznání za rok 2026, ř. 401a.',
      '**Kdy podat přiznání.** Zaměstnanec s podepsaným prohlášením nemusí podávat přiznání, pokud jeho ostatní příjmy podle § 7 až 10 nepřesáhnou za rok 20 000 Kč. Zahraniční dividendy se do toho počítají. Když s ostatními příjmy přesáhnou 20 000 Kč, přiznání podat musíte. Zdroj: § 38g odst. 2 a § 8 odst. 3 a 4 ZDP.',
      '**Schovávejte potvrzení o každém nákupu** (datum a cena). Bez nich časový test těžko doložíte.',
      '**Americká ETF a dědická daň.** Pokud máte v USA majetek nad 60 000 USD, může po vašem úmrtí vzniknout povinnost podat v USA přiznání k dědictví. Česko s USA smlouvu o dědické dani nemá. Akcie irských fondů se za americký majetek nepovažují. Zdroj: IRS, Instructions for Form 706-NA (září 2025); IRS, Estate & gift tax treaties (8. 9. 2026).'] },
    { k: 'h', s: '5. Jak fond koupit' },
    { k: 'p', s: 'Postup je stejný u každého brokera, který evropská ETF nabízí:' },
    { k: 'list', mark: '1', items: [
      'V aplikaci brokera vyhledejte **ISIN** z části 1. Ticker se liší podle burzy.',
      'Zkontrolujte název fondu. „Acc“ znamená akumulační, „Dist“ distribuční.',
      'Vyberte burzu. Na Xetře nakupujete v eurech.',
      'V ceníku brokera si najděte poplatek za obchod a za směnu měny a porovnejte ho s tím, kolik měsíčně vkládáte.',
      'Pokud fond nenajdete, napište brokerovi ISIN. Nabídka se u brokerů liší.'] },
    { k: 'p', s: 'Konkrétního brokera nedoporučujeme a od žádného nemáme provizi.' },
    { k: 'hr' },
    { k: 'p', s: `Plán vám přišel, protože jste si ho ${pragueDate(sentOn)} vyžádali na ${new URL(siteUrl).host}. Další e-maily posíláme, jen pokud jste zaškrtli odběr novinek. [Odhlásit se]`, mail: true },
    { k: 'p', s: 'Co jste v nástroji vybrali a z jaké reklamy jste přišli, si ukládáme, abychom poznali, které reklamy lidem pomáhají. Proti tomu můžete kdykoli vznést námitku: stačí odpovědět na tento e-mail.', mail: true },
    { k: 'p', s: `ETF Dvojče · [DOPLNIT: provozovatel, IČO, sídlo] · [Zásady ochrany osobních údajů](${siteUrl}/ochrana-osobnich-udaju/)`, mail: true },
    { k: 'p', s: 'Informace slouží jen ke vzdělávání. Nejde o investiční doporučení, investiční poradenství ani daňové poradenství. Minulá výkonnost není zárukou budoucích výnosů. Hodnota investice může klesat i stoupat a nemusí se vám vrátit celá vložená částka.' },
  ];
}

const TD = 'padding:6px 8px;border-bottom:1px solid #d9d9d4;text-align:left;vertical-align:top;font-size:13px;line-height:1.4';
function html(b: Block): string {
  switch (b.k) {
    case 'h': return `<h2 style="margin:28px 0 10px;font-size:20px;line-height:1.3">${inline(b.s)}</h2>`;
    case 'h3': return `<h3 style="margin:18px 0 8px;font-size:16px">${inline(b.s)}</h3>`;
    case 'p': return `<p style="margin:0 0 12px">${inline(b.s)}</p>`;
    case 'hr': return '<hr style="border:0;border-top:1px solid #d9d9d4;margin:24px 0">';
    case 'cta': return `<p style="margin:16px 0"><a href="${esc(b.href)}" style="display:inline-block;padding:14px 22px;background:#14532d;color:#ffffff;font-weight:bold;text-decoration:none;border-radius:4px">${esc(b.s)}</a></p>`;
    case 'list': {
      const tag = b.mark === '1' ? 'ol' : 'ul', style = b.mark === '☐' ? 'list-style:none;padding-left:0' : 'padding-left:22px';
      return `<${tag} style="margin:0 0 12px;${style}">${b.items.map((i) => `<li style="margin:0 0 8px">${b.mark === '☐' ? '☐ ' : ''}${inline(i)}</li>`).join('')}</${tag}>`;
    }
    case 'table': return `<div style="overflow-x:auto;margin:0 0 12px"><table style="border-collapse:collapse;width:100%"><tr>${b.head.map((c) => `<th scope="col" style="${TD};background:#f1f1ec">${esc(c)}</th>`).join('')}</tr>${b.rows.map((r) => `<tr>${r.map((c) => `<td style="${TD}">${inline(c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
  }
}
function text(b: Block): string {
  switch (b.k) {
    case 'h': return `\n== ${b.s} ==\n`;
    case 'h3': return `\n${b.s}\n`;
    case 'p': return plain(b.s) + '\n';
    case 'hr': return '--\n';
    case 'cta': return `${b.s}: ${b.href}\n`;
    case 'list': return b.items.map((i, n) => `${b.mark === '1' ? `${n + 1}.` : b.mark === '☐' ? '[ ]' : '-'} ${plain(i)}`).join('\n') + '\n';
    case 'table': return [b.head, ...b.rows].map((r) => r.map(plain).join(' | ')).join('\n') + '\n';
  }
}

export function renderEmail(plan: Plan, sel: Selection, siteUrl: string, sentOn: Date = new Date()) {
  const list = blocks(plan, sel, siteUrl, sentOn), subject = subjectFor(plan, sel);
  const pre = 'ISIN pro vyhledání u brokera, poplatky v korunách a daně z ETF v Česku 2026.';
  return {
    subject,
    html: `<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head><body style="margin:0;background:#f4f4f0"><div style="display:none;max-height:0;overflow:hidden">${esc(pre)}</div><table role="presentation" width="100%" style="border-collapse:collapse"><tr><td align="center" style="padding:12px 0"><table role="presentation" width="600" style="width:100%;max-width:600px;border-collapse:collapse;background:#ffffff"><tr><td style="padding:24px 20px;font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#1a1a1a">${list.map(html).join('')}</td></tr></table></td></tr></table></body></html>`,
    text: `${subject}\n\n${list.map(text).join('\n')}`,
  };
}
