"use client";

import { useCallback, useRef } from "react";
import {
  ARCH_EDGES,
  ARCH_NODES,
  ZONES,
  type ArchNode,
} from "@/data/architecture";
import { cn } from "@/lib/utils";
import { EDGE_STYLE, NODE_STYLE } from "./style";

export interface ArchitectureCanvasProps {
  selectedId: string;
  onSelect: (id: string) => void;
  /** Node ids emphasised by the current lifecycle stage. Empty = show all. */
  activeNodes: Set<string>;
  /** Edge ids animated by the current lifecycle stage. */
  activeEdges: Set<string>;
  /** Suppresses the travelling pulse. */
  reducedMotion: boolean;
}

/**
 * The zoned architecture canvas.
 *
 * Two renderings of the same data, chosen by viewport:
 *
 * - **Desktop** gets the SVG diagram — four ownership zones, eleven
 *   components, typed edges.
 * - **Mobile** gets a vertical list grouped by zone. Not a fallback: a
 *   1240-unit-wide diagram squeezed into 360 CSS pixels is unreadable and
 *   un-tappable, and pretending otherwise would be worse than offering a
 *   layout that actually works with a thumb.
 *
 * Both are driven by the same `ARCH_NODES`, so they cannot disagree, and both
 * are keyboard-operable with the same arrow-key model.
 */
export function ArchitectureCanvas({
  selectedId,
  onSelect,
  activeNodes,
  activeEdges,
  reducedMotion,
}: ArchitectureCanvasProps) {
  const nodeRefs = useRef<Record<string, SVGGElement | HTMLButtonElement | null>>({});
  const isStepping = activeNodes.size > 0;

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      const { key } = event;
      if (key === "Enter" || key === " ") {
        event.preventDefault();
        onSelect(ARCH_NODES[index]!.id);
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
      const next = ARCH_NODES[(index + delta + ARCH_NODES.length) % ARCH_NODES.length]!;
      nodeRefs.current[next.id]?.focus();
      onSelect(next.id);
    },
    [onSelect],
  );

  return (
    <>
      {/* ═══════════════ desktop: the diagram ═══════════════ */}
      <div className="hidden overflow-x-auto p-3 md:block md:p-4">
        <svg
          viewBox="0 0 1240 748"
          className="h-auto w-full min-w-[860px]"
          role="group"
          aria-label="AAConnect architecture diagram. Four ownership zones and eleven components. Tab to reach a component, arrow keys to move between them, Enter to read its description."
        >
          <defs>
            {Object.entries(EDGE_STYLE).map(([kind, s]) => (
              <marker
                key={kind}
                id={`ac-arrow-${kind}`}
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

          {/* ---- ownership zones ---- */}
          {ZONES.map((zone) => (
            <g key={zone.id}>
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.w}
                height={zone.h}
                rx="16"
                fill={zone.accent}
                fillOpacity="0.022"
                stroke={zone.accent}
                strokeOpacity="0.2"
                strokeWidth="1"
                strokeDasharray="8 6"
              />
              <text
                x={zone.x + 16}
                y={zone.y - 10}
                fill={zone.accent}
                fontSize="10.5"
                fontFamily="ui-monospace, monospace"
                letterSpacing="1.6"
                opacity="0.85"
              >
                {zone.label.toUpperCase()}
              </text>
            </g>
          ))}

          {/* ---- edges ---- */}
          {ARCH_EDGES.map((edge) => {
            const style = EDGE_STYLE[edge.kind];
            const active = activeEdges.has(edge.id);
            const dimmed = isStepping && !active;

            return (
              <g key={edge.id} opacity={dimmed ? 0.12 : 1}>
                <path
                  d={edge.d}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={active ? style.width + 0.9 : style.width}
                  strokeDasharray={style.dash}
                  markerEnd={`url(#ac-arrow-${edge.kind})`}
                  opacity={active ? 1 : 0.5}
                />
                {active && !reducedMotion && (
                  <path
                    data-motion="decorative"
                    d={edge.d}
                    fill="none"
                    stroke={style.stroke}
                    strokeWidth={style.width + 1.8}
                    strokeLinecap="round"
                    strokeDasharray="4 240"
                    className="animate-dash"
                    style={{ animationDuration: "2.4s" }}
                  />
                )}
              </g>
            );
          })}

          {/* ---- components ---- */}
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
                onClick={() => onSelect(node.id)}
                onKeyDown={(e) => onKeyDown(e, index)}
                opacity={dimmed ? 0.26 : 1}
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
                  strokeWidth={isSelected ? 2.2 : isActive ? 1.8 : 1}
                />
                {(isSelected || isActive) && (
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.w}
                    height={node.h}
                    rx="12"
                    fill={style.accent}
                    opacity={isSelected ? 0.11 : 0.06}
                    pointerEvents="none"
                  />
                )}
                <circle cx={node.x + 17} cy={node.y + 24} r="3.5" fill={style.accent} />
                <text
                  x={node.x + 31}
                  y={node.y + 28}
                  fill="#e2e7f2"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                >
                  {node.label}
                </text>
                <text
                  x={node.x + 17}
                  y={node.y + 48}
                  fill="#68728a"
                  fontSize="9.5"
                  fontFamily="ui-monospace, monospace"
                >
                  {node.caption}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ═══════════════ mobile: vertical, grouped by zone ═══════════════ */}
      <div className="md:hidden">
        <p className="border-b border-ink-700/70 px-4 py-2.5 font-mono text-[10px] tracking-[0.16em] text-mist-500 uppercase">
          Components by owner
        </p>
        <ul className="divide-y divide-ink-700/50">
          {ZONES.map((zone) => {
            const zoneNodes = ARCH_NODES.filter((n) => n.zone === zone.id);
            return (
              <li key={zone.id} className="px-4 py-3">
                <p
                  className="font-mono text-[10px] tracking-[0.14em] uppercase"
                  style={{ color: zone.accent }}
                >
                  {zone.label}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-mist-600">{zone.note}</p>

                <ul className="mt-3 space-y-2">
                  {zoneNodes.map((node) => {
                    const index = ARCH_NODES.indexOf(node);
                    const style = NODE_STYLE[node.kind];
                    const isSelected = node.id === selectedId;
                    const isActive = activeNodes.has(node.id);
                    return (
                      <li key={node.id}>
                        <button
                          type="button"
                          ref={(el) => {
                            nodeRefs.current[node.id] = el;
                          }}
                          aria-pressed={isSelected}
                          onClick={() => onSelect(node.id)}
                          onKeyDown={(e) => onKeyDown(e, index)}
                          className={cn(
                            "flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                            isSelected
                              ? "border-azure-500/50 bg-azure-500/10"
                              : isActive
                                ? "border-ink-500 bg-ink-800/70"
                                : "border-ink-700/70 bg-ink-850/50",
                            isStepping && !isActive && !isSelected && "opacity-45",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                            style={{ background: style.accent }}
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-mist-100">
                              {node.label}
                            </span>
                            <span className="mt-0.5 block font-mono text-[10px] text-mist-500">
                              {node.caption}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export type { ArchNode };
