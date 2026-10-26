"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ARCH_EDGES,
  ARCH_NODES,
  EDGE_LEGEND,
  LIFECYCLE,
  type EdgeKind,
  type NodeKind,
} from "@/data/architecture";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";

/**
 * An explorable architecture diagram.
 *
 * Three things to know about how this is built:
 *
 * 1. **It is inline SVG, not a diagramming library.** The whole thing is a few
 *    kilobytes of markup. A graph library would be ~100 KB to lay out nine
 *    boxes whose positions are already known and hand-tuned for legibility.
 *
 * 2. **Every node is a real focusable control.** Each is a `<g role="button">`
 *    with `tabIndex`, `aria-pressed` and Enter/Space handling, so the diagram
 *    is fully operable from the keyboard. Arrow keys move between nodes in
 *    reading order, which beats tabbing through nine of them.
 *
 * 3. **Nothing is animated by JavaScript per frame.** The flow uses CSS
 *    `stroke-dashoffset` on the highlighted edges. Under reduced motion the
 *    dashes stop and the highlight becomes a static colour change — the
 *    diagram still communicates, it just stops moving.
 *
 * Content note: every label here is a generic role from the publicly
 * documented Account Aggregator framework. See `src/data/architecture.ts` for
 * the confidentiality rules this diagram is written under.
 */

const NODE_STYLE: Record<NodeKind, { fill: string; stroke: string; accent: string }> = {
  client: { fill: "#141821", stroke: "#2a3140", accent: "#5b9cff" },
  gateway: { fill: "#12161f", stroke: "#3b7df5", accent: "#8ab8ff" },
  service: { fill: "#141821", stroke: "#2a3140", accent: "#a98bff" },
  adapter: { fill: "#141821", stroke: "#2a3140", accent: "#4fd1e0" },
  external: { fill: "#0f131b", stroke: "#2a3140", accent: "#c3abff" },
  store: { fill: "#141821", stroke: "#2a3140", accent: "#4ad6a0" },
  ops: { fill: "#141821", stroke: "#2a3140", accent: "#f0b35b" },
};

const EDGE_STYLE: Record<EdgeKind, { stroke: string; dash?: string; width: number }> = {
  request: { stroke: "#3b7df5", width: 1.6 },
  response: { stroke: "#4fd1e0", width: 1.6 },
  async: { stroke: "#a98bff", dash: "6 5", width: 1.5 },
  error: { stroke: "#f0b35b", dash: "5 4", width: 1.5 },
  store: { stroke: "#4ad6a0", dash: "3 5", width: 1.3 },
  observe: { stroke: "#68728a", dash: "2 6", width: 1.3 },
};

export function ArchitectureExplorer() {
  const reduced = usePrefersReducedMotion();

  const [selectedId, setSelectedId] = useState<string>("gateway");
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const nodeRefs = useRef<Record<string, SVGGElement | null>>({});

  const selected = useMemo(
    () => ARCH_NODES.find((n) => n.id === selectedId) ?? ARCH_NODES[0]!,
    [selectedId],
  );

  const step = stepIndex === null ? null : LIFECYCLE[stepIndex] ?? null;

  /* --- lifecycle playback ----------------------------------------- */
  useEffect(() => {
    if (!playing) return;

    const timer = setTimeout(() => {
      setStepIndex((current) => {
        const next = (current ?? -1) + 1;
        if (next >= LIFECYCLE.length) {
          setPlaying(false);
          return current;
        }
        return next;
      });
    }, reduced ? 2600 : 3400);

    return () => clearTimeout(timer);
  }, [playing, stepIndex, reduced]);

  const play = useCallback(() => {
    setStepIndex(0);
    setPlaying(true);
  }, []);

  const stop = useCallback(() => {
    setPlaying(false);
    setStepIndex(null);
  }, []);

  /* --- what is emphasised right now -------------------------------- */
  const activeNodes = useMemo(() => new Set(step?.nodes ?? []), [step]);
  const activeEdges = useMemo(() => new Set(step?.edges ?? []), [step]);
  const isStepping = step !== null;

  /* --- keyboard: arrows move between nodes -------------------------- */
  const onNodeKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      const { key } = event;

      if (key === "Enter" || key === " ") {
        event.preventDefault();
        setSelectedId(ARCH_NODES[index]!.id);
        return;
      }

      const delta =
        key === "ArrowRight" || key === "ArrowDown"
          ? 1
          : key === "ArrowLeft" || key === "ArrowUp"
            ? -1
            : 0;
      if (delta === 0) return;

      event.preventDefault();
      const nextIndex = (index + delta + ARCH_NODES.length) % ARCH_NODES.length;
      const nextNode = ARCH_NODES[nextIndex]!;
      nodeRefs.current[nextNode.id]?.focus();
      setSelectedId(nextNode.id);
    },
    [],
  );

  return (
    <div className="space-y-5">
      {/* ---------------- controls ---------------- */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={playing ? stop : play}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
            playing
              ? "border-azure-500/50 bg-azure-500/12 text-azure-300"
              : "border-ink-600 bg-ink-850/60 text-mist-200 hover:border-azure-500/50 hover:text-white",
          )}
          aria-describedby="arch-live"
        >
          <Icon name={playing ? "X" : "Workflow"} size={15} />
          {playing ? "Stop walkthrough" : "Play request lifecycle"}
        </button>

        {LIFECYCLE.map((s, index) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setPlaying(false);
              setStepIndex(index === stepIndex ? null : index);
            }}
            aria-pressed={index === stepIndex}
            className={cn(
              "rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors",
              index === stepIndex
                ? s.isErrorPath
                  ? "border-amber-glow/50 bg-amber-glow/12 text-amber-glow"
                  : "border-azure-500/50 bg-azure-500/12 text-azure-300"
                : "border-ink-600/80 bg-ink-850/50 text-mist-500 hover:border-ink-500 hover:text-mist-300",
            )}
          >
            {index + 1}
          </button>
        ))}

        {isStepping && (
          <button
            type="button"
            onClick={stop}
            className="ml-auto inline-flex items-center gap-1.5 text-xs text-mist-500 transition-colors hover:text-mist-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Announces step changes to screen readers without stealing focus. */}
      <p id="arch-live" aria-live="polite" className="sr-only">
        {step ? `Step ${(stepIndex ?? 0) + 1} of ${LIFECYCLE.length}: ${step.title}. ${step.description}` : ""}
      </p>

      <div className="grid items-start gap-5 lg:grid-cols-[1.55fr_1fr]">
        {/* ---------------- diagram ---------------- */}
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-ink-700/70 px-4 py-2.5">
            <span className="font-mono text-[10px] tracking-[0.18em] text-mist-500 uppercase">
              Illustrative architecture
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded border border-ink-600 bg-ink-850 px-2 py-1 font-mono text-[10px] text-mist-500"
              title="Generic component roles from the publicly documented Account Aggregator framework. Not a depiction of any employer's internal production architecture."
            >
              <Icon name="Info" size={10} />
              generic · not internal
            </span>
          </div>

          <div className="overflow-x-auto p-3 md:p-4">
            <svg
              viewBox="0 0 1000 500"
              className="h-auto w-full min-w-[640px]"
              role="group"
              aria-label="Interactive architecture diagram. Use Tab to reach a component, arrow keys to move between components, and Enter to read its description."
            >
              <defs>
                {Object.entries(EDGE_STYLE).map(([kind, s]) => (
                  <marker
                    key={kind}
                    id={`arr-${kind}`}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto-start-reverse"
                  >
                    <path d="M0 0 L10 5 L0 10 z" fill={s.stroke} />
                  </marker>
                ))}
              </defs>

              {/* ---- edges ---- */}
              {ARCH_EDGES.map((edge) => {
                const style = EDGE_STYLE[edge.kind];
                const active = activeEdges.has(edge.id);
                const dimmed = isStepping && !active;

                return (
                  <g key={edge.id} opacity={dimmed ? 0.18 : 1}>
                    <path
                      d={edge.d}
                      fill="none"
                      stroke={style.stroke}
                      strokeWidth={active ? style.width + 0.8 : style.width}
                      strokeDasharray={style.dash}
                      markerEnd={`url(#arr-${edge.kind})`}
                      opacity={active ? 1 : 0.55}
                    />
                    {/* The travelling pulse. Only on the active edges, and only
                        when motion is allowed. */}
                    {active && !reduced && (
                      <path
                        data-motion="decorative"
                        d={edge.d}
                        fill="none"
                        stroke={style.stroke}
                        strokeWidth={style.width + 1.6}
                        strokeLinecap="round"
                        strokeDasharray="4 190"
                        className="animate-dash"
                        style={{ animationDuration: "2.2s" }}
                      />
                    )}
                  </g>
                );
              })}

              {/* ---- nodes ---- */}
              {ARCH_NODES.map((node, index) => {
                const style = NODE_STYLE[node.kind];
                const isSelected = node.id === selectedId;
                const isActive = activeNodes.has(node.id);
                const dimmed = isStepping && !isActive;

                return (
                  <g
                    key={node.id}
                    ref={(el) => {
                      nodeRefs.current[node.id] = el;
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`${node.label}. ${node.caption}.`}
                    onClick={() => setSelectedId(node.id)}
                    onKeyDown={(e) => onNodeKeyDown(e, index)}
                    opacity={dimmed ? 0.3 : 1}
                    className="cursor-pointer outline-none [&:focus-visible>rect:first-of-type]:stroke-azure-400 [&:focus-visible>rect:first-of-type]:[stroke-width:2.5]"
                  >
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.w}
                      height={node.h}
                      rx="12"
                      fill={style.fill}
                      stroke={isSelected || isActive ? style.accent : style.stroke}
                      strokeWidth={isSelected ? 2 : isActive ? 1.75 : 1}
                    />
                    {/* Selection glow, drawn as a second rect so the focus
                        ring above can target the first one unambiguously. */}
                    {(isSelected || isActive) && (
                      <rect
                        x={node.x}
                        y={node.y}
                        width={node.w}
                        height={node.h}
                        rx="12"
                        fill={style.accent}
                        opacity={isSelected ? 0.1 : 0.06}
                        pointerEvents="none"
                      />
                    )}
                    <circle cx={node.x + 18} cy={node.y + 23} r="3.5" fill={style.accent} />
                    <text
                      x={node.x + 32}
                      y={node.y + 27}
                      fill="#e2e7f2"
                      fontSize="12.5"
                      fontWeight="600"
                      fontFamily="system-ui, sans-serif"
                    >
                      {node.label}
                    </text>
                    <text
                      x={node.x + 18}
                      y={node.y + 46}
                      fill="#68728a"
                      fontSize="10"
                      fontFamily="ui-monospace, monospace"
                    >
                      {node.caption}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* ---- legend ---- */}
          <div className="border-t border-ink-700/70 px-4 py-3">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {EDGE_LEGEND.map((entry) => {
                const style = EDGE_STYLE[entry.kind];
                return (
                  <li
                    key={entry.kind}
                    className="inline-flex items-center gap-2 font-mono text-[10px] text-mist-500"
                  >
                    <svg width="22" height="8" aria-hidden="true">
                      <line
                        x1="1"
                        y1="4"
                        x2="21"
                        y2="4"
                        stroke={style.stroke}
                        strokeWidth="2"
                        strokeDasharray={style.dash}
                      />
                    </svg>
                    {entry.label}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* ---------------- detail panel ---------------- */}
        <div className="space-y-4">
          {step && (
            <div
              className={cn(
                "rounded-xl border p-5",
                step.isErrorPath
                  ? "border-amber-glow/30 bg-amber-glow/[0.06]"
                  : "border-azure-500/30 bg-azure-500/[0.06]",
              )}
            >
              <p
                className={cn(
                  "font-mono text-[10px] tracking-[0.18em] uppercase",
                  step.isErrorPath ? "text-amber-glow" : "text-azure-300",
                )}
              >
                Step {(stepIndex ?? 0) + 1} of {LIFECYCLE.length}
                {step.isErrorPath && " · failure path"}
              </p>
              <h4 className="mt-2 font-display text-base font-semibold text-mist-50">
                {step.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-mist-400">
                {step.description}
              </p>
            </div>
          )}

          <div className="surface-card p-5">
            <p className="font-mono text-[10px] tracking-[0.18em] text-mist-500 uppercase">
              Component
            </p>
            <h4 className="mt-2 flex items-center gap-2.5 font-display text-lg font-semibold text-mist-50">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: NODE_STYLE[selected.kind].accent }}
              />
              {selected.label}
            </h4>

            <div className="mt-3 space-y-3">
              {selected.detail.map((paragraph, index) => (
                <p key={index} className="text-sm leading-relaxed text-mist-400">
                  {paragraph}
                </p>
              ))}
            </div>

            {selected.responsibilities && selected.responsibilities.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-ink-700/60 pt-4">
                {selected.responsibilities.map((item, index) => (
                  <li key={index} className="flex gap-2.5">
                    <Icon
                      name="Check"
                      size={13}
                      className="mt-0.5 shrink-0 text-jade-400"
                    />
                    <span className="text-xs leading-relaxed text-mist-400">{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {selected.tech && selected.tech.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-ink-700/60 pt-4">
                {selected.tech.map((technology) => (
                  <li key={technology}>
                    <Tag>{technology}</Tag>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="flex items-start gap-2 px-1 text-[11px] leading-relaxed text-mist-600">
            <Icon name="Info" size={12} className="mt-0.5 shrink-0" />
            Select any component — or press Tab into the diagram and use the arrow
            keys — to read what it does.
          </p>
        </div>
      </div>
    </div>
  );
}
