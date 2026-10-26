import type { EdgeKind, NodeKind } from "@/data/architecture";

/**
 * Shared visual vocabulary for the architecture views.
 *
 * Kept in one place so the architecture canvas and the sequence diagram cannot
 * drift into describing the same interaction with two different colours — the
 * two views have to agree or the case study contradicts itself.
 *
 * Colours are the design tokens from `globals.css`, written as literals
 * because SVG `stroke` and `fill` cannot read Tailwind classes.
 */

export const NODE_STYLE: Record<NodeKind, { fill: string; stroke: string; accent: string }> = {
  client: { fill: "#141821", stroke: "#2a3140", accent: "#5b9cff" },
  user: { fill: "#141821", stroke: "#2a3140", accent: "#4fd1e0" },
  tsp: { fill: "#12161f", stroke: "#3a4354", accent: "#a98bff" },
  callback: { fill: "#12161f", stroke: "#3a4354", accent: "#f0b35b" },
  adapter: { fill: "#0f131b", stroke: "#2a3140", accent: "#8ab8ff" },
  aggregator: { fill: "#0f131b", stroke: "#3a4354", accent: "#c3abff" },
  provider: { fill: "#0f131b", stroke: "#2a3140", accent: "#c3abff" },
  security: { fill: "#141821", stroke: "#2a3140", accent: "#4ad6a0" },
  analyser: { fill: "#141821", stroke: "#2a3140", accent: "#4ad6a0" },
};

export const EDGE_STYLE: Record<
  EdgeKind,
  { stroke: string; dash?: string; width: number }
> = {
  sync: { stroke: "#5b9cff", width: 1.7 },
  redirect: { stroke: "#4fd1e0", dash: "7 4", width: 1.7 },
  notify: { stroke: "#f0b35b", dash: "2 5", width: 1.8 },
  fidata: { stroke: "#a98bff", width: 1.7 },
  encrypted: { stroke: "#4ad6a0", dash: "10 3", width: 1.8 },
  internal: { stroke: "#828da6", dash: "4 4", width: 1.5 },
  failure: { stroke: "#ff7a6b", dash: "5 4", width: 1.6 },
};
