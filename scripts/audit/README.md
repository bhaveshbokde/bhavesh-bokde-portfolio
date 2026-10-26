# Layout audit scripts

Two browser-driven sweeps that look for the class of defect a unit test cannot
see. `jsdom` does no CSS layout at all, so nothing in the Vitest suite can tell
you that text spilled out of a box, that a flex item collapsed, or that an SVG
label drew through its own border. These can.

They are **investigation tools**, broader and noisier than the regression tests
in `e2e/portfolio.spec.ts`. The tests are the gate; these are what you reach for
when something looks wrong and you want to know where.

## Running them

Both expect a production build being served. Build first — a stale server will
serve HTML referencing chunk hashes that no longer exist, every page will render
unstyled, and you will get a page of failures that are entirely an artefact of
the harness:

```bash
npm run build
npx next start -p 3100 &
node scripts/audit/overflow.mjs
node scripts/audit/diagram-geometry.mjs
```

Point them elsewhere with `AUDIT_BASE`:

```bash
AUDIT_BASE=https://bhavesh-bokde-portfolio.vercel.app node scripts/audit/overflow.mjs
```

Both exit non-zero when they find something.

## `overflow.mjs`

Sweeps 6 routes × 5 viewports (320, 375, 768, 1280, 1920) with three detectors:

1. **`html-overflow-x`** — an element whose text is wider than its own box.
2. **`svg-text-outside-node`** — an SVG `<text>` drawn outside the `<rect>` in
   its group. SVG text does not wrap and is not clipped, so this is invisible
   until you measure it.
3. **`past-viewport`** — an element extending beyond the document's right edge.

On `/projects/aaconnect` it also drives the architecture explorer — every tab,
every lifecycle stage, every selectable component — because a node can only
overflow once it has content in it.

**Known exclusions, and why.** Visually-hidden content is clipped on purpose:
the skip link and the `aria-live` regions are 1px boxes with `overflow: hidden`,
so a naive `scrollWidth` check reports every one of them as broken. Elements
inside an ancestor with `overflow: auto | scroll | hidden` are clipped and
cannot extend the scrollable area. SVG text marked `data-outside-box="true"` —
the diagram's zone captions — sits above its box by design.

## `diagram-geometry.mjs`

Four checks on the AAConnect diagram, in SVG user units via `getBBox()`:

1. Every `<text>` sits inside its node's `<rect>`.
2. No two node boxes overlap — wrapping grows a node downwards, and a node that
   grows into its neighbour is wrong in a way that still "fits".
3. Every node is inside the zone that contains its centre.
4. Nothing extends past the `viewBox`.
