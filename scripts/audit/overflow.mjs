import { chromium } from "@playwright/test";

const BASE = process.env.AUDIT_BASE || "http://localhost:3100";
const ROUTES = ["/", "/projects/aaconnect", "/projects/finsight",
  "/projects/ecommerce-backend", "/projects/notification-service",
  "/projects/sql-interview-mastery"];
const VIEWPORTS = [
  { name: "mobile-sm", width: 320, height: 720 },
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1920, height: 1080 },
];

/* Runs inside the page. Three independent detectors. */
const DETECT = () => {
  const out = [];
  /* Visually-hidden content is *supposed* to be clipped: the skip link and the
     aria-live regions are 1px boxes with overflow:hidden, so a naive
     scrollWidth check reports every one of them as broken. They are not. */
  const srOnly = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width <= 1.5 && r.height <= 1.5) return true;
    if (cs.clipPath && cs.clipPath !== "none") return true;
    if (cs.clip && cs.clip !== "auto") return true;
    // Positioned entirely off-screen (skip links park themselves at -200px).
    if (r.right < 0 || r.bottom < 0) return true;
    return false;
  };
  const label = (el) => {
    const t = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 48);
    return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} "${t}"`;
  };

  /* 1 ── HTML text wider than its own box (clipped or spilling). */
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("svg")) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    if (srOnly(el) || el.closest(".sr-only")) continue;
    // Only leaf-ish text nodes; a wrapper's scrollWidth reflects its children.
    const direct = [...el.childNodes].some(
      (n) => n.nodeType === 3 && n.textContent.trim());
    if (!direct) continue;
    const over = el.scrollWidth - el.clientWidth;
    if (over > 1 && cs.overflowX !== "auto" && cs.overflowX !== "scroll") {
      out.push({ kind: "html-overflow-x", by: over, el: label(el) });
    }
    // Text clipped vertically by a fixed height.
    const overY = el.scrollHeight - el.clientHeight;
    if (overY > 1 && cs.overflowY === "hidden" && cs.position !== "absolute") {
      out.push({ kind: "html-clipped-y", by: overY, el: label(el) });
    }
  }

  /* 2 ── SVG <text> escaping the <rect> it is meant to sit inside.
         Pairs each text with the nearest preceding rect in its own <g>. */
  for (const svg of document.querySelectorAll("svg")) {
    if (!svg.getBoundingClientRect().width) continue;
    for (const text of svg.querySelectorAll("text")) {
      const g = text.closest("g");
      if (!g) continue;
      const rect = g.querySelector("rect");
      if (!rect) continue;
      // A caption deliberately set above its box is not an overflow.
      if (text.dataset.outsideBox === "true") continue;
      const tb = text.getBoundingClientRect();
      const rb = rect.getBoundingClientRect();
      if (!tb.width || !rb.width) continue;
      const pad = 1;
      const spill = Math.max(
        rb.left - tb.left, tb.right - rb.right,
        rb.top - tb.top, tb.bottom - rb.bottom);
      if (spill > pad) {
        out.push({
          kind: "svg-text-outside-node", by: Math.round(spill),
          el: `<text> "${(text.textContent || "").trim().slice(0, 40)}"`,
        });
      }
    }
  }

  /* 3 ── Any element extending past the document's right edge. */
  const docW = document.documentElement.clientWidth;
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    if (cs.position === "fixed") continue;
    if (srOnly(el) || el.closest(".sr-only")) continue;
    // Purely decorative glow/blur layers are allowed to bleed past the edge;
    // they carry no content and the page does not scroll to reach them.
    if (el.getAttribute("aria-hidden") === "true" && !el.textContent.trim()) continue;
    if (r.right > docW + 1 && !el.closest("[data-allow-overflow]")) {
      // Ignore things inside a deliberate horizontal scroller.
      let scroller = el.parentElement, inScroller = false;
      while (scroller && scroller !== document.body) {
        const s = getComputedStyle(scroller).overflowX;
        // `hidden` clips just as effectively as `auto` — the element is not
        // reachable and cannot extend the scrollable area.
        if (s === "auto" || s === "scroll" || s === "hidden") { inScroller = true; break; }
        scroller = scroller.parentElement;
      }
      if (!inScroller) out.push({
        kind: "past-viewport", by: Math.round(r.right - docW), el: label(el) });
    }
  }

  // Deduplicate: the same defect often reports on nested elements.
  const seen = new Set();
  return out.filter((o) => {
    const k = `${o.kind}|${o.el}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
};

const browser = await chromium.launch();
let total = 0;
const report = {};

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);

    let findings = await page.evaluate(DETECT);

    // The architecture explorer hides most of itself until driven. Walk every
    // view and every stage, because a node only overflows once it has content.
    if (route === "/projects/aaconnect") {
      for (const tab of ["Sequence", "Failure paths", "Architecture"]) {
        const t = page.getByRole("tab", { name: tab });
        if (await t.count()) {
          await t.click();
          await page.waitForTimeout(350);
          findings.push(...(await page.evaluate(DETECT)));
        }
      }
      // Step the lifecycle so every stage's label renders at least once.
      const next = page.getByRole("button", { name: /next stage/i });
      if (await next.count()) {
        for (let i = 0; i < 10; i++) {
          await next.click({ force: true }).catch(() => {});
          await page.waitForTimeout(140);
          findings.push(...(await page.evaluate(DETECT)));
        }
      }
      // Select each component, which swaps the detail panel's text.
      const nodes = await page.locator("g[role='button'], button[data-node]").all();
      for (const n of nodes.slice(0, 12)) {
        await n.click({ force: true }).catch(() => {});
        await page.waitForTimeout(120);
        findings.push(...(await page.evaluate(DETECT)));
      }
    }

    const seen = new Set();
    findings = findings.filter((f) => {
      const k = `${f.kind}|${f.el}`;
      if (seen.has(k)) return false; seen.add(k); return true;
    });

    if (findings.length) {
      report[`${vp.name} ${route}`] = findings;
      total += findings.length;
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();

for (const [where, items] of Object.entries(report)) {
  console.log(`\n━━ ${where} — ${items.length}`);
  for (const i of items.slice(0, 14))
    console.log(`   ${i.kind.padEnd(22)} +${String(i.by).padStart(4)}px  ${i.el}`);
  if (items.length > 14) console.log(`   … ${items.length - 14} more`);
}
console.log(total ? `\n✗ ${total} finding(s)` : "\n✓ no overflow found");
process.exit(total ? 1 : 0);
