import { describe, expect, it } from "vitest";
import { ARCH_NODES } from "@/data/architecture";
import { NODE_METRICS, layoutNode, textWidth, wrapText } from "./measure";

/**
 * Regression cover for the diagram-overflow bug.
 *
 * The defect: every node drew its label and caption as a single `<text>` at a
 * fixed offset. SVG text does not wrap and is not clipped, so three nodes drew
 * straight out through their own right-hand border — "Financial Information
 * Providers" by 19 user units, "internal · downstream of the protocol" by 38.
 *
 * The invariant worth protecting is not "these three strings are fine", it is
 * "no string in the data can escape its box". So the last test walks every
 * node in `architecture.ts` and checks the computed layout — which means
 * editing a caption to something longer fails here, at the point the text
 * changed, rather than silently shipping.
 */

describe("textWidth", () => {
  it("is exact for monospace, where every glyph advances equally", () => {
    // 0.6em is the advance of the ui-monospace stack.
    expect(textWidth("abcd", 10, true)).toBeCloseTo(4 * 10 * 0.6, 5);
    expect(textWidth("MMMM", 10, true)).toBeCloseTo(textWidth("iiii", 10, true), 5);
  });

  it("gives proportional glyphs different widths", () => {
    expect(textWidth("mmmm", 12)).toBeGreaterThan(textWidth("iiii", 12));
    expect(textWidth("WWWW", 12)).toBeGreaterThan(textWidth("llll", 12));
  });

  it("scales linearly with font size", () => {
    expect(textWidth("Account", 24)).toBeCloseTo(textWidth("Account", 12) * 2, 5);
  });

  it("over-estimates rather than under-estimates the real face", () => {
    // Measured with getComputedTextLength() against the rendered diagram:
    // "Selected Account Aggregator" is 174.5u at 12px/600. The estimate must
    // not come in under that, or text goes back outside the box.
    expect(textWidth("Selected Account Aggregator", 12)).toBeGreaterThanOrEqual(174.5);
    expect(textWidth("Request intake & routing", 12)).toBeGreaterThanOrEqual(150.5);
    expect(textWidth("Financial Information Providers", 12)).toBeGreaterThanOrEqual(190);
  });
});

describe("wrapText", () => {
  it("leaves text that already fits on one line", () => {
    expect(wrapText("short", 500, 12)).toEqual(["short"]);
  });

  it("breaks on spaces and keeps every word", () => {
    const lines = wrapText("Financial Information Providers", 169, 12);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ").split(/\s+/)).toEqual([
      "Financial", "Information", "Providers",
    ]);
  });

  it("keeps every wrapped line within the width it was given", () => {
    const max = 169;
    for (const line of wrapText("internal · downstream of the protocol", max, 9.5, true)) {
      expect(textWidth(line, 9.5, true)).toBeLessThanOrEqual(max);
    }
  });

  it("never drops a word when wrapping", () => {
    const text = "one two three four five six seven eight";
    const lines = wrapText(text, 60, 12, false, 4);
    expect(lines.join(" ")).toBe(text);
  });
});

describe("layoutNode", () => {
  it("never shrinks a node below its authored height", () => {
    // The hand-placed layout uses authored heights to keep rows aligned.
    const layout = layoutNode("Hi", "ok", 300, 88);
    expect(layout.height).toBe(88);
  });

  it("grows the node when wrapping adds a line", () => {
    const narrow = layoutNode(
      "Financial Information Providers", "the source of record", 212, 60);
    const wide = layoutNode(
      "Financial Information Providers", "the source of record", 600, 60);
    expect(narrow.labelLines.length).toBeGreaterThan(wide.labelLines.length);
    expect(narrow.height).toBeGreaterThan(60);
  });

  it("places the caption below the last label line, never on top of it", () => {
    const layout = layoutNode(
      "Financial Information Providers", "the source of record", 212, 60);
    const lastLabelBaseline =
      NODE_METRICS.labelBaseline +
      (layout.labelLines.length - 1) * NODE_METRICS.labelLineHeight;
    expect(layout.captionTop).toBeGreaterThan(lastLabelBaseline);
  });

  /* ── the invariant ─────────────────────────────────────────────────────── */

  it.each(ARCH_NODES.map((n) => [n.label, n] as const))(
    "lays out %s inside its own box",
    (_label, node) => {
      const layout = layoutNode(node.label, node.caption, node.w, node.h);
      const m = NODE_METRICS;

      for (const line of layout.labelLines) {
        expect(textWidth(line, m.labelSize)).toBeLessThanOrEqual(
          node.w - m.labelX - m.padRight,
        );
      }
      for (const line of layout.captionLines) {
        expect(textWidth(line, m.captionSize, true)).toBeLessThanOrEqual(
          node.w - m.padX - m.padRight,
        );
      }

      // Nothing was truncated away to make it fit.
      expect(layout.labelLines.join(" ")).toBe(node.label);
      expect(layout.captionLines.join(" ")).toBe(node.caption);

      // The text fits vertically inside the height the node will be drawn at.
      const lastBaseline =
        layout.captionTop +
        (layout.captionLines.length - 1) * m.captionLineHeight;
      expect(lastBaseline).toBeLessThanOrEqual(layout.height - 4);
    },
  );
});
