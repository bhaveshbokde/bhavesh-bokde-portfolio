/**
 * Captures the site at the viewport sizes that matter, for a visual check.
 *
 * Two things make this harder than `chrome --headless --screenshot`, and both
 * are artefacts of the capture rather than bugs in the page:
 *
 * 1. The reveal-on-scroll sections only become visible once an
 *    IntersectionObserver has fired for them. A one-shot screenshot never
 *    scrolls, so everything below the hero captures at opacity 0.
 *
 * 2. Playwright's `fullPage: true` resizes the page to its whole height to
 *    capture it, and the compositor hands back the pre-reveal frame for the
 *    animated sections — so a full-page shot comes out blank even though
 *    `getComputedStyle(...).opacity` reads 1 at that moment.
 *
 * So this script scrolls one viewport at a time and captures each screenful
 * in place. Slower, but it photographs what a visitor actually sees.
 *
 * Usage:
 *   npx next start -p 3100 &
 *   node scripts/screenshots.mjs [outputDir] [baseUrl]
 *
 * Output defaults to ./screenshots, which is git-ignored.
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const OUT = process.argv[2] ?? "screenshots";
const BASE = process.argv[3] ?? "http://127.0.0.1:3100";

const SHOTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 },
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "tablet-834", width: 834, height: 1112 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "case-study-aaconnect", width: 1440, height: 900, url: "/projects/aaconnect" },
  { name: "project-finsight", width: 1440, height: 900, url: "/projects/finsight" },
  { name: "not-found", width: 1440, height: 900, url: "/no-such-page", fullPage: false },
  { name: "reduced-motion", width: 1440, height: 900, reducedMotion: true },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();

for (const shot of SHOTS) {
  const context = await browser.newContext({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: 1,
    reducedMotion: shot.reducedMotion ? "reduce" : "no-preference",
  });
  const page = await context.newPage();

  // `load` rather than `networkidle`: the 404 route never reaches network
  // idle within the default timeout, and waiting for quiet is not what this
  // script needs anyway — the scroll pass below is what settles the page.
  await page.goto(BASE + (shot.url ?? "/"), { waitUntil: "load" });
  await page.waitForTimeout(600);

  if (shot.fullPage === false) {
    const path = `${OUT}/${shot.name}.png`;
    await page.screenshot({ path });
    console.log(`captured ${path}`);
    await context.close();
    continue;
  }

  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const screens = Math.ceil(pageHeight / shot.height);

  for (let index = 0; index < screens; index += 1) {
    const y = index * shot.height;
    await page.evaluate((top) => window.scrollTo(0, top), y);
    // Long enough for the 0.6s reveal transition to finish before the shot.
    await page.waitForTimeout(900);

    const path = `${OUT}/${shot.name}-${String(index + 1).padStart(2, "0")}.png`;
    await page.screenshot({ path });
    console.log(`captured ${path}`);
  }

  await context.close();
}

await browser.close();
