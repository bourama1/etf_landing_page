# Co musí být hotové před spuštěním reklam (koncept do README)

Stav k 15. 10. 2026. Každý bod má zdroj nebo odkaz na místo v repozitáři. Pořadí: nejdřív to, bez čeho reklamu
pustit nejde.

## 1. Blokuje spuštění

- [ ] **Provozovatel a kontakt.** Doplnit všechna místa `[DOPLNIT …]` (stav 15. 10. 2026):
  - `src/components/About.astro:6, 11` (jméno, IČO, sídlo; e-mail)
  - `src/components/Footer.astro:6–7` (totéž v patičce)
  - `src/pages/ochrana-osobnich-udaju.astro:19` (správce: jméno, IČO, sídlo, e-mail)
  - `src/pages/ochrana-osobnich-udaju.astro:67` (místo zpracování a předání mimo EU, podklady níže)
  - `src/pages/ochrana-osobnich-udaju.astro:70` (potvrdit lhůty uchování)
  - `src/lib/email.ts:140` (odkaz pro odhlášení), `src/lib/email.ts:142` (provozovatel v patičce e-mailu)
  - copy zdroje: `content/page.md:247, 254, 311`, `content/email.md:15, 186`
  - kontrola: `grep -rn "DOPLNIT" src content` nesmí nic najít.
- [ ] **Vlastní doména a ověřený odesílatel.** Brevo neumí ověřit adresu na bezplatné doméně (gmail.com,
  seznam.cz …) a odesílatele v transakčních e-mailech nahradí adresou `…@<id>.t-sender-sib.com` (v testu 15. 10. 2026 Gmail ukázal `…@12474095.brevosend.com`, Seznam původní adresu na email.cz). Brevo sám to
  označuje za „a stopgap measure … not a permanent solution“
  ([Brevo, 13. 10. 2026](https://help.brevo.com/hc/en-us/articles/14925263522578)). Seznam vyžaduje platné SPF a
  DKIM, jinak zprávy „mohou být doručeny do složky Spam nebo zcela zahozeny“, a důrazně doporučuje DMARC
  ([Nápověda Email.cz](https://o-seznam.cz/napoveda/email/pro-odesilatele-hromadnych-zprav/povinne-technicke-nalezitosti/)).
  Postup: koupit doménu → v Brevo *Senders, Domains* ověřit doménu (Brevo kód, DKIM, DMARC `p=none`;
  [Brevo](https://help.brevo.com/hc/en-us/articles/10415456027666)) → `BREVO_SENDER_EMAIL` na této doméně →
  vlastní doménu napojit i na Vercel a změnit `SITE_URL` → znovu poslat zkušební plán na Seznam, Gmail a Outlook.
  DNS se může propisovat až 48 hodin.
  **Ověřeno 15. 10. 2026:** zkušební plán z adresy na email.cz skončil na Seznamu ve **spamu**, na Gmailu ve
  složce Doručené (odesílatel přepsaný na …@…brevosend.com). Screenshoty: `docs/screenshots/email-*.png`.
- [ ] **Vercel Hobby je jen pro nekomerční použití.** „Hobby teams are restricted to non-commercial personal use
  only.“ Za komerční se počítá i „Advertising the sale of a product or service“ a každé nasazení „used for the
  purpose of financial gain of anyone involved“ ([Vercel Fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage)).
  Placená kampaň pro firmu → **Vercel Pro**, nebo přesun na **Cloudflare Pages** (pak přepsat `/api/lead` na
  Pages Function a znovu nastavit omezení počtu odeslání).
- [ ] **Reklamní pravidla Meta (Instagram).** Aktuální znění „Financial and insurance products and services“
  (změny naposledy 30. 4. 2026,
  [Meta Transparency Centre](https://transparency.meta.com/en-gb/policies/ad-standards/restricted-goods-services/financial-services/)):
  „Advertisers may be required to be licensed in the country that they are targeting … Investment products and
  opportunities“ patří mezi produkty, které licenci vyžadovat mohou. Bez autorizace smí běžet mimo jiné „Ads that
  only mention a financial service or product without the ability to obtain or connect with that product/service“.
  ETF Dvojče nic neprodává a nezprostředkovává, takže do této výjimky pravděpodobně spadá. **Ověřit** při
  zakládání kampaně v Ads Manageru a s právníkem. Kategorie *Financial products and services* (Special Ad
  Category) je podle dokumentace Meta povinná pro reklamy cílené na USA; pro Evropu se zmiňuje jen u úvěrů
  ([Meta for Developers](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/special-ad-category)).
  Při zakládání kampaně zkontrolovat, jestli ji Ads Manager pro Česko nevyžádá.
- [ ] **Google Ads (jen pokud by se přidaly).** Google rozšířil ověřování inzerentů finančních služeb na všechny
  země EU/EHP; neověřený inzerent má 30 dní, pak se reklamy omezí
  ([Google blog](https://blog.google/products/ads-commerce/eu-financial-advertiser-verification/)). Pro Česko má
  Google samostatnou stránku
  [Financial Services Verification – Czechia](https://support.google.com/adspolicy/answer/15332527). ETF Dvojče
  není regulovaný subjekt; před kampaní zjistit, do které z pěti kategorií inzerentů spadá.
- [ ] **Právník** potvrdí `data/sources.md` §9 (právní základ pro e-mail s plánem a pro novinky) a §10 (souhlas
  s měřením podle § 89 odst. 3 ZEK) a texty `ochrana-osobnich-udaju`. Moje čtení zákona není právní rada.
- [ ] **Brevo: vypnout automatické blokování neznámých IP.** U nového API klíče Brevo nejdřív IP adresy volajících
  povoluje samo, ale když 30 dní nepřibude nová IP, začne volání z neznámých IP blokovat
  ([Brevo, 5. 10. 2026](https://help.brevo.com/hc/en-us/articles/5740111683858)). Funkce na Vercelu volají z
  měnících se adres, takže po klidném měsíci by každý lead skončil chybou. V Brevo *Security → Authorized IPs*
  automatické blokování deaktivovat (nebo hlídat e-mail od Brevo o zablokované IP).

## 2. Těsně před spuštěním

- [ ] **Denní aktualizace kurzu ČNB.** Na tomto projektu Vercel se Deploy Hook vytvořit nepodařilo (Matěj,
  15. 10. 2026), takže denní přestavba neběží. Kurz EUR/CZK se teď stáhne při každém nasazení (každý push) a stránka
  ukazuje, ke kterému dni platí („kurz ČNB k …“). Před spuštěním: vytvořit Deploy Hook (Vercel → Settings → Git →
  Deploy Hooks; podle dokumentace jich Hobby i Pro mají až 5 na projekt,
  [Vercel](https://vercel.com/docs/deploy-hooks#limits)), uložit ho jako GitHub secret `VERCEL_DEPLOY_HOOK` a
  v `.github/workflows/fx-rebuild.yml` vrátit řádky `schedule`. Ověřit ručním spuštěním (Actions → FX rebuild →
  Run workflow) a druhý den datum kurzu na stránce.
- [ ] **Vymazat testovací data v Umami.** Živé testy posílaly skutečné kampaňové UTM (`etf_dvojce_2026q4`).
  Umami umí smazat nasbíraná data a ponechat nastavení webu
  ([Reset website analytics](https://docs.umami.is/docs/api-reference/reset-website)); jinak report filtrovat
  od data spuštění.
- [ ] **Smazat testovací kontakty v Brevo** (adresy z ověřování 15. 10. 2026), aby neseděly v seznamu „Plán“.
- [ ] **Data starší ~3 měsíců znovu ověřit.** Snímek je z 9.–15. 10. 2026 (`retrieved_at` v `data/*.json`).
  TER, ISIN, poplatky brokerů a daňová pravidla se mění; postup v `data/sources.md`, po úpravě
  `node data/validate.mjs` musí vypsat `OK`.
- [ ] `node scripts/funnel-check.mjs`, `LIVE_URL=… UMAMI_WEBSITE_ID=… node scripts/funnel-check.mjs`,
  `node scripts/qa-live.mjs`, `node scripts/check-links.mjs` na produkční adrese.

## 3. Limity, které je třeba hlídat po spuštění

- **Brevo Free:** 300 e-mailů denně. Transakčních e-mailů nad limit Brevo podrží až 1 000 ve frontě, další už
  nedoručí. E-maily z Free plánu vždy nesou „Sent with Brevo“
  ([Brevo, 15. 10. 2026](https://help.brevo.com/hc/en-us/articles/208580669)). Při ~300 proklicích denně a
  konverzi 5 % (README) je to asi 15 e-mailů denně, rezerva je velká; při násobně větší kampani přejít na Starter.
- **Umami Hobby:** 100 tisíc událostí měsíčně (`docs/readme-drafts/tracking.md`, rozpočet událostí).
- **Omezení odeslání formuláře:** pravidlo Vercel Firewall 10 odeslání za 10 minut z jedné IP (Hobby: jedno
  pravidlo, nejvýš 10minutové okno;
  [Vercel](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)). Mobilní operátoři sdílejí IP mezi
  zákazníky (CGNAT); po spuštění sledovat počet odpovědí 429 ve Firewall přehledu.
- **Denní přestavba kvůli kurzu ČNB** (`.github/workflows/fx-rebuild.yml`, až bude zapnutá): GitHub v public repozitáři vypne
  plánované workflow po 60 dnech bez aktivity
  ([GitHub Docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)).
  Když se v repozitáři dva měsíce nic neděje, workflow znovu zapnout v záložce Actions. Když build kurz nestáhne,
  stránka ukáže poslední uložený a jeho datum.
