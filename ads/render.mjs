// Renders the four ad images from ads/src/ads.html (content/ads.md): Instagram Stories 9:16 and Feed 4:5 per ad.
// Run: node ads/render.mjs   → ads/ad-a/*.png, ads/ad-b/*.png. Fails if any text overflows its frame.
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const SRC = pathToFileURL(resolve('ads/src/ads.html')).href;
const OUT = [['a-story', 'ads/ad-a/story-1080x1920.png', 1920], ['a-feed', 'ads/ad-a/feed-1080x1350.png', 1350],
  ['b-story', 'ads/ad-b/story-1080x1920.png', 1920], ['b-feed', 'ads/ad-b/feed-1080x1350.png', 1350]];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
let bad = 0;
for (const [id, path, height] of OUT) {
  await page.goto(`${SRC}#${id}`);
  await page.evaluate(() => document.fonts.ready);
  const el = page.locator(`#${id}`);
  // The spacer at the bottom keeps Instagram's UI band free: content must not push it out of the frame.
  const fits = await el.evaluate((s) => s.scrollHeight <= s.clientHeight && [...s.querySelectorAll('*')].every((c) => c.getBoundingClientRect().right <= 1080));
  if (!fits) { bad++; console.error(`${id}: content overflows the frame`); }
  await el.screenshot({ path });
  console.log(`${path} (1080×${height})`);
}
await browser.close();
process.exit(bad ? 1 : 0);
