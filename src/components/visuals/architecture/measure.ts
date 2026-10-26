/**
 * Text measurement and wrapping for the architecture diagram.
 *
 * SVG `<text>` does not wrap. There is no `width` on it, no `overflow`, and no
 * line-breaking algorithm — a string is laid out on one infinite line and
 * simply draws past whatever box you thought it was inside. So the component
 * has to decide the line breaks itself, and to decide them it needs to know
 * how wide a string will be *before* the browser has drawn anything.
 *
 * Why not measure for real:
 *
 * - `getComputedTextLength()` and `getBBox()` only work after the element is
 *   in a rendered document. The diagram is server-rendered, so at the moment
 *   the markup is produced there is no layout to query, and wrapping in a
 *   post-render effect would ship a visibly unwrapped first paint.
 * - `canvas.measureText()` needs a canvas, which does not exist during SSR and
 *   is not implemented in jsdom — so the unit tests could not check the thing
 *   the tests exist to check.
 *
 * So this estimates, from a table of per-character advance widths as a
 * fraction of the font size. For the monospace caption that is exact: every
 * glyph in a monospaced font is the same width, and 0.6em is the standard
 * advance for the ui-monospace stack. For the proportional label it is an
 * approximation, deliberately biased to *over*-estimate — guessing a string is
 * wider than it is costs an early line break, while guessing it is narrower
 * puts text back outside the box, which is the bug this exists to prevent.
 */

/** Advance width of one character, as a fraction of the font size. */
const NARROW = new Set("ijltfrI.,;:'\"!|()[]{}/\\-");
const WIDE = new Set("mwMW@%");
const UPPER = /[A-Z]/;
const DIGIT = /[0-9]/;

function charRatio(ch: string): number {
  if (ch === " ") return 0.26;
  if (NARROW.has(ch)) return 0.32;
  if (WIDE.has(ch)) return 0.88;
  if (UPPER.test(ch)) return 0.68;
  if (DIGIT.test(ch)) return 0.57;
  return 0.55;
}

/**
 * Width of `text` in SVG user units.
 *
 * `monospace` short-circuits the table: in a monospaced face every glyph
 * advances the same distance, so the count alone is the answer.
 */
export function textWidth(
  text: string,
  fontSize: number,
  monospace = false,
): number {
  if (monospace) return text.length * fontSize * 0.6;
  let total = 0;
  for (const ch of text) total += charRatio(ch);
  return total * fontSize * SAFETY;
}

/**
 * Correction applied to the proportional estimate.
 *
 * Not a guessed round number. Every label in `architecture.ts` was measured
 * with `getComputedTextLength()` against the real rendered face at the real
 * size, and compared with what the table above predicts:
 *
 *     Request intake & routing      real 150.5   table 133.0   ×1.132
 *     Decryption boundary           real 127.2   table 112.4   ×1.131
 *     Consent orchestration         real 133.8   table 120.1   ×1.114
 *     Selected Account Aggregator   real 174.5   table 159.4   ×1.095
 *     Client FIU                    real  58.6   table  56.2   ×1.043
 *
 * The table under-reads by at most 13.2%, so 1.18 clears the worst observed
 * case with headroom for a system that resolves `system-ui` to a wider face
 * than the one measured. Erring high costs an early line break; erring low
 * puts text back outside the box.
 *
 * Re-derive it by rendering a probe `<text>` into the diagram's own `<svg>`
 * and calling `getComputedTextLength()` — the figures above came from exactly
 * that, which is also why this constant is not simply asserted in a test: the
 * test cannot see the visitor's font.
 */
const SAFETY = 1.18;

/**
 * Greedy word wrap to a maximum width, capped at `maxLines`.
 *
 * Breaks on spaces. The middle-dot separator used throughout this diagram
 * ("request · await · fetch") is treated as its own breakable token, so a
 * caption prefers to break at a separator rather than mid-phrase.
 *
 * If the text cannot fit in `maxLines`, the last line is truncated with an
 * ellipsis rather than allowed to run on — but note that every caption in
 * `architecture.ts` currently fits in two lines, and the regression test in
 * `ArchitectureCanvas.test.tsx` fails if that ever stops being true. Silent
 * truncation of a component description would be worse than overflow, because
 * overflow is at least visible.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  monospace = false,
  maxLines = 2,
): string[] {
  if (textWidth(text, fontSize, monospace) <= maxWidth) return [text];

  const words = text.split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (textWidth(candidate, fontSize, monospace) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }

  // Everything still unplaced goes on the final line.
  const placed = lines.join(" ").split(" ").filter(Boolean).length;
  const rest = words.slice(placed).join(" ");
  if (rest) lines.push(rest);
  else if (current) lines.push(current);

  if (lines.length <= maxLines) return lines.filter(Boolean);

  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1] ?? "";
  while (last && textWidth(`${last}…`, fontSize, monospace) > maxWidth) {
    last = last.slice(0, -1);
  }
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

/* ── geometry ───────────────────────────────────────────────────────────── */

export const NODE_METRICS = {
  /** Left inset for the status dot and the caption. */
  padX: 17,
  /** Left inset for the label, which clears the dot. */
  labelX: 31,
  /** Inner right margin. Text must stop before this. */
  padRight: 12,
  labelSize: 12,
  labelLineHeight: 15,
  captionSize: 9.5,
  captionLineHeight: 12.5,
  /** Baseline of the first label line, relative to the node's top edge. */
  labelBaseline: 28,
  /** Distance from the last label baseline to the first caption baseline. */
  captionOffset: 20,
  /** Space kept below the last caption baseline. */
  padBottom: 14,
} as const;

export interface NodeLayout {
  labelLines: string[];
  captionLines: string[];
  /** Height the node needs to contain its text, never less than the authored one. */
  height: number;
  /** Baseline of the first caption line, relative to the node's top edge. */
  captionTop: number;
}

/**
 * Wraps a node's text and returns the height the node needs to hold it.
 *
 * A node never shrinks below its authored height — the hand-placed layout in
 * `architecture.ts` uses those heights to keep rows aligned, and letting a
 * short-captioned node collapse would pull the diagram out of true. It only
 * ever grows, and only by the height of the lines wrapping actually added.
 */
export function layoutNode(
  label: string,
  caption: string,
  width: number,
  authoredHeight: number,
): NodeLayout {
  const m = NODE_METRICS;
  const labelLines = wrapText(
    label,
    width - m.labelX - m.padRight,
    m.labelSize,
    false,
  );
  const captionLines = wrapText(
    caption,
    width - m.padX - m.padRight,
    m.captionSize,
    true,
  );

  const lastLabelBaseline =
    m.labelBaseline + (labelLines.length - 1) * m.labelLineHeight;
  const captionTop = lastLabelBaseline + m.captionOffset;
  const lastCaptionBaseline =
    captionTop + (captionLines.length - 1) * m.captionLineHeight;

  return {
    labelLines,
    captionLines,
    captionTop,
    height: Math.max(authoredHeight, lastCaptionBaseline + m.padBottom),
  };
}
