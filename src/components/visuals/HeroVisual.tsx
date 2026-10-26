"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { usePointerTilt } from "@/hooks/usePointerTilt";
import { cn } from "@/lib/utils";

/**
 * The hero's engineering visual: a request moving through a backend.
 *
 * It is a composed, layered panel rather than a diagram floating in space —
 * a request enters, fans out through a service, hits a cache that sometimes
 * misses, reaches persistence, and returns. The stage advances on a timer so
 * the picture is always saying something, and the whole panel tilts gently
 * towards a fine pointer.
 *
 * Why this and not Three.js: it is a dozen rounded rectangles and some
 * strokes. A WebGL scene would ship hundreds of kilobytes and hold a GPU
 * context to draw something that is fundamentally 2D, and it would be the
 * slowest thing on the page on the phone of the recruiter most likely to be
 * looking at it.
 *
 * Honesty: every value shown is a static label describing a *kind* of thing —
 * "cache", "retry", "p99" — never a number. Nothing here claims to be live
 * telemetry, because none of it is.
 *
 * Under reduced motion the stage sits on the step that shows the most of the
 * system and never advances, and the tilt is not wired up at all.
 */

interface Stage {
  id: string;
  label: string;
  /** Edge ids that carry the request during this stage. */
  edges: string[];
  /** Node ids lit during this stage. */
  nodes: string[];
  tone: "flow" | "warn";
}

const STAGES: Stage[] = [
  { id: "ingress", label: "request accepted", edges: ["e1"], nodes: ["client", "api"], tone: "flow" },
  { id: "validate", label: "validated · routed", edges: ["e2"], nodes: ["api", "svc"], tone: "flow" },
  { id: "cache", label: "cache consulted", edges: ["e3"], nodes: ["svc", "cache"], tone: "flow" },
  { id: "miss", label: "miss · falls through", edges: ["e4"], nodes: ["cache", "db"], tone: "warn" },
  { id: "persist", label: "read committed", edges: ["e5"], nodes: ["db", "svc"], tone: "flow" },
  { id: "respond", label: "response returned", edges: ["e6"], nodes: ["svc", "api", "client"], tone: "flow" },
];

const NODES = [
  { id: "client", label: "client", x: 16, y: 104, w: 96, h: 44 },
  { id: "api", label: "API", x: 150, y: 104, w: 84, h: 44 },
  { id: "svc", label: "service", x: 272, y: 104, w: 96, h: 44 },
  { id: "cache", label: "cache", x: 272, y: 22, w: 96, h: 40 },
  { id: "db", label: "PostgreSQL", x: 272, y: 190, w: 116, h: 40 },
] as const;

const EDGES = [
  { id: "e1", d: "M 112 126 H 150" },
  { id: "e2", d: "M 234 126 H 272" },
  { id: "e3", d: "M 304 104 V 62" },
  { id: "e4", d: "M 336 62 C 336 96, 330 160, 330 190" },
  { id: "e5", d: "M 300 190 V 148" },
  { id: "e6", d: "M 272 138 H 150 M 150 138 H 112" },
] as const;

export function HeroVisual() {
  const reduced = usePrefersReducedMotion();
  const tiltRef = usePointerTilt<HTMLDivElement>({ maxTilt: 4, lift: 4 });
  // Index 2 shows the most of the system at rest, so it is the static frame.
  const [stage, setStage] = useState(reduced ? 2 : 0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  /* Stop advancing when scrolled away — an animation nobody can see is heat. */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? true), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !inView) return;
    const timer = setTimeout(() => setStage((s) => (s + 1) % STAGES.length), 2200);
    return () => clearTimeout(timer);
  }, [stage, reduced, inView]);

  const active = STAGES[stage]!;
  const warn = active.tone === "warn";

  return (
    <div ref={wrapRef} className="relative w-full">
      <div
        ref={tiltRef}
        className="relative transition-transform duration-500 ease-out will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Layered surface: a lit panel, not a floating SVG. */}
        <div
          aria-hidden="true"
          className="absolute -inset-5 rounded-panel opacity-70 blur-2xl"
          style={{
            background:
              "radial-gradient(60% 60% at var(--tilt-x,50%) var(--tilt-y,50%), rgb(91 156 255 / 0.18), transparent 70%)",
          }}
        />

        <div className="relative overflow-hidden rounded-panel border border-ink-600/70 bg-gradient-to-b from-ink-850/90 to-ink-900/95 shadow-[var(--shadow-lift)] backdrop-blur-sm">
          {/* Panel chrome */}
          <div className="flex items-center justify-between gap-3 border-b border-ink-700/70 px-4 py-2.5">
            <span className="eyebrow-sm text-mist-600">request path</span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-micro transition-colors duration-500",
                warn
                  ? "border-amber-glow/40 bg-amber-glow/10 text-amber-glow"
                  : "border-jade-400/30 bg-jade-400/10 text-jade-400",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  warn ? "bg-amber-glow" : "bg-jade-400",
                )}
              />
              {active.label}
            </span>
          </div>

          <div className="bg-dots px-4 py-5 opacity-[0.96]">
            <svg
              viewBox="0 0 404 250"
              className="h-auto w-full"
              role="img"
              aria-label="Illustration of a backend request path: a client calls an API, which routes to a service that consults a cache, falls through to PostgreSQL on a miss, and returns a response."
            >
              <defs>
                <linearGradient id="hv-flow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b7df5" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#5b9cff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#a98bff" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* edges */}
              {EDGES.map((edge) => {
                const on = active.edges.includes(edge.id);
                return (
                  <g key={edge.id}>
                    <path
                      d={edge.d}
                      fill="none"
                      stroke={on ? (warn ? "#f0b35b" : "url(#hv-flow)") : "#343c4d"}
                      strokeWidth={on ? 2 : 1.2}
                      strokeDasharray={edge.id === "e4" ? "5 4" : undefined}
                      className="transition-all duration-500"
                    />
                    {on && !reduced && (
                      <path
                        data-motion="decorative"
                        d={edge.d}
                        fill="none"
                        stroke={warn ? "#f0b35b" : "#8ab8ff"}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="3 120"
                        className="animate-dash"
                        style={{ animationDuration: "1.6s" }}
                      />
                    )}
                  </g>
                );
              })}

              {/* nodes */}
              {NODES.map((node) => {
                const on = active.nodes.includes(node.id);
                return (
                  <g key={node.id} className="transition-opacity duration-500" opacity={on ? 1 : 0.62}>
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.w}
                      height={node.h}
                      rx="10"
                      fill={on ? "#171c27" : "#12161f"}
                      stroke={on ? (warn ? "#f0b35b" : "#5b9cff") : "#343c4d"}
                      strokeWidth={on ? 1.6 : 1}
                      className="transition-all duration-500"
                    />
                    <text
                      x={node.x + node.w / 2}
                      y={node.y + node.h / 2 + 4}
                      textAnchor="middle"
                      fill={on ? "#e2e7f2" : "#8d97ad"}
                      fontSize="11"
                      fontFamily="ui-monospace, monospace"
                      className="transition-colors duration-500"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Static descriptors. Kinds of concern, never numbers. */}
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-ink-700/70 px-4 py-3">
            {["idempotent retries", "bounded timeouts", "fail-open cache"].map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-1.5 font-mono text-micro text-mist-600"
              >
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-azure-400/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
