import { chromium } from "@playwright/test";
const BASE = process.env.AUDIT_BASE || "http://localhost:3100";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(BASE + "/projects/aaconnect", { waitUntil: "networkidle" });
await p.waitForTimeout(600);

const r = await p.evaluate(() => {
  const svg = [...document.querySelectorAll("svg")]
    .find(s => s.getAttribute("viewBox") === "0 0 1240 748");
  if (!svg) return { error: "diagram not found" };
  const bb = (el) => { const b = el.getBBox(); return {x:b.x,y:b.y,w:b.width,h:b.height}; };
  const nodes = [...svg.querySelectorAll("g[role='button']")].map(g => ({
    label: g.querySelector("text")?.textContent,
    aria: g.getAttribute("aria-label"),
    rect: bb(g.querySelector("rect")),
    texts: [...g.querySelectorAll("text")].map(t => ({ s: t.textContent, b: bb(t) })),
  }));
  // zones = <g> with a dashed rect and no role
  const zones = [...svg.querySelectorAll("g")].filter(g =>
    !g.getAttribute("role") && g.querySelector("rect[stroke-dasharray]")
  ).map(g => ({ label: g.querySelector("text")?.textContent, rect: bb(g.querySelector("rect")) }));
  return { nodes, zones, viewBox: svg.viewBox.baseVal };
});
if (r.error) { console.log(r.error); process.exit(1); }

let fail = 0; const bad = m => { console.log("  ✗ " + m); fail++; };
const PAD = 12;

console.log("1. text inside its node box");
for (const n of r.nodes) {
  for (const t of n.texts) {
    const right = n.rect.x + n.rect.w, bottom = n.rect.y + n.rect.h;
    const spill = Math.max(n.rect.x - t.b.x, t.b.x + t.b.w - (right - PAD + 2),
                           n.rect.y - t.b.y, t.b.y + t.b.h - bottom);
    if (spill > 0.5) bad(`"${n.label}" text "${t.s?.slice(0,34)}" spills ${spill.toFixed(1)}u`);
  }
}
console.log(`   ${r.nodes.length} nodes, ${r.nodes.reduce((a,n)=>a+n.texts.length,0)} text runs checked`);

console.log("2. no two node boxes overlap");
for (let i=0;i<r.nodes.length;i++) for (let j=i+1;j<r.nodes.length;j++) {
  const a=r.nodes[i].rect, c=r.nodes[j].rect;
  const ox = Math.min(a.x+a.w, c.x+c.w) - Math.max(a.x, c.x);
  const oy = Math.min(a.y+a.h, c.y+c.h) - Math.max(a.y, c.y);
  if (ox > 0.5 && oy > 0.5)
    bad(`"${r.nodes[i].label}" overlaps "${r.nodes[j].label}" by ${ox.toFixed(0)}x${oy.toFixed(0)}u`);
}

console.log("3. every node inside its zone");
for (const n of r.nodes) {
  // Pick the zone whose box contains the node's centre, then the smallest
  // such zone. Matching on "x fits and y is below" picked the first zone in
  // document order, which reported nodes against a zone they are not in.
  const cx = n.rect.x + n.rect.w / 2, cy = n.rect.y + n.rect.h / 2;
  const candidates = r.zones.filter(z =>
    cx >= z.rect.x && cx <= z.rect.x + z.rect.w &&
    cy >= z.rect.y && cy <= z.rect.y + z.rect.h);
  const z = candidates.sort((a, b) =>
    a.rect.w * a.rect.h - b.rect.w * b.rect.h)[0];
  if (!z) { bad(`"${n.label}" sits in no zone`); continue; }
  const below = (n.rect.y + n.rect.h) - (z.rect.y + z.rect.h);
  if (below > 0.5) bad(`"${n.label}" extends ${below.toFixed(0)}u below zone "${z.label}"`);
}

console.log("4. nothing outside the viewBox");
for (const n of r.nodes) {
  if (n.rect.x + n.rect.w > r.viewBox.width + 0.5)
    bad(`"${n.label}" past the right edge of the canvas`);
  if (n.rect.y + n.rect.h > r.viewBox.height + 0.5)
    bad(`"${n.label}" past the bottom edge of the canvas`);
}

await b.close();
console.log(fail ? `\n✗ ${fail} geometry problem(s)` : "\n✓ diagram geometry sound");
process.exit(fail ? 1 : 0);
