# Real-phone check (Matěj) — Phase 5

Do it on your own phone, mobile data (Wi-Fi off). Ad URLs:

- A: `https://etf-landing-page-sigma.vercel.app/?utm_source=instagram&utm_medium=paid_social&utm_campaign=etf_dvojce_2026q4&utm_term=cz&utm_content=ad_a_blocked`
- B: same with `utm_content=ad_b_fees`

Open each **three times**: in the phone's browser (Chrome/Safari), in the **Instagram in-app browser** (send the
link to yourself in an Instagram DM and tap it), and once more in the browser after clearing site data (first visit).
Note OK / problem + screenshot for anything odd.

## First screen (no scrolling, don't touch anything for 3 s)

1. A: headline "Broker vám nedovolí koupit VOO? Má evropské dvojče.", one line under it, the ETF chips visible.
   B: "Kolik vás za 20 let stojí poplatky?…", the fee result in Kč visible.
2. Nothing jumps while the page loads (text doesn't re-wrap when the font arrives, B's step 2 doesn't move up).
   This is the font fix (Roboto fallback on Android): watch the headline and paragraphs closely.
3. No consent bar yet, no sticky bar yet.

## Tool and consent

4. First scroll or tap → the "Smíme měřit…" bar appears at the **top**. It must not cover the bottom button. Choose
   "Souhlasím" on one run, "Nesouhlasím" on another.
5. A: tap VOO → twins appear; move both sliders (numbers follow your thumb); pick a broker; pick "Reinvestovat".
   B: tap "Vybráno: VOO · změnit" → the chips open with VOO selected.
6. The bottom bar "Poslat plán e-mailem" appears once the form is off screen. Tap it: the page scrolls to the form
   and the **form heading is fully visible** (also while the consent bar is still open: test once without answering it).
7. FAQ rows show "+" and open/close with a tap ("−" when open).

## Form (real address, only after Brevo is live)

8. Empty submit → red message under the field. "abc" → "Tenhle e-mail nevypadá…".
9. Your real address → "Hotovo. Plán je na cestě na …", the table with ISINs, "Poslat odkaz" opens the share sheet.
10. E-mail arrives (note: inbox / Hromadné / spam, and how long it took). Open it in the Seznam app and the Gmail app;
    screenshot the top and the table. Tap "Otevřít plán online" → `/plan` opens and shows your picks.
11. Instagram in-app browser only: does the submit work, does the back button return to Instagram, does the e-mail
    link later open in the normal browser.

## Other

12. Rotate to landscape once: nothing cut off, no sideways scrolling.
13. System dark mode on → page still readable (it has no dark theme; it should simply stay light).
14. System font size "large" → texts wrap, nothing overlaps, buttons still tappable.
15. Footer "Nastavení měření" reopens the consent bar.
