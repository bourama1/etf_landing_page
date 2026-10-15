// Build-time EUR/CZK fetch: ČNB's API sends no CORS headers, so the browser cannot call it.
import { existsSync, writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

export async function updateFx({ fetch = globalThis.fetch, today, file }) {
  const source_url = `https://api.cnb.cz/cnbapi/exrates/daily?date=${today}&lang=CZ`;
  try {
    const res = await fetch(source_url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`ČNB HTTP ${res.status}`);
    const eur = (await res.json()).rates?.find((r) => r.currencyCode === 'EUR');
    if (!eur) throw new Error('EUR missing in ČNB response');
    const rate = eur.rate / eur.amount;
    if (!(rate >= 15 && rate <= 40)) throw new Error(`implausible EUR/CZK rate ${rate}`);
    const fx = { rate, validFor: eur.validFor, source_url, retrieved_at: today };
    writeFileSync(file, JSON.stringify(fx, null, 2) + '\n');
    return { kept: false, ...fx };
  } catch (err) {
    if (!existsSync(file)) throw err;
    console.warn(`fetch-fx: keeping existing ${file} (${err.message})`);
    return { kept: true };
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }).format(new Date());
  const file = fileURLToPath(new URL('../data/fx.json', import.meta.url));
  console.log(await updateFx({ today, file }));
}
