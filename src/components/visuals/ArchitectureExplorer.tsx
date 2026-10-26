"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ARCH_NODES,
  EDGE_LEGEND,
  LIFECYCLE,
  SPEC_REFERENCES,
  ZONES,
} from "@/data/architecture";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { ArchitectureCanvas } from "./architecture/ArchitectureCanvas";
import { SequenceDiagram } from "./architecture/SequenceDiagram";
import { FailureExplorer } from "./architecture/FailureExplorer";
import { SourceBadge } from "./architecture/SourceBadge";
import { EDGE_STYLE, NODE_STYLE } from "./architecture/style";

type View = "architecture" | "sequence" | "failures";

const VIEWS: { id: View; label: string; icon: string }[] = [
  { id: "architecture", label: "Architecture", icon: "Network" },
  { id: "sequence", label: "Sequence", icon: "GitBranch" },
  { id: "failures", label: "Failure paths", icon: "TriangleAlert" },
];

/**
 * The AAConnect architecture explorer.
 *
 * Three views over one dataset, plus a ten-stage guided walkthrough.
 *
 * Autoplay is opt-in and never required — every stage is reachable by Next,
 * Previous or a direct stage button, because a visitor reading carefully
 * should not have to race a timer. Playback pauses rather than restarts, and
 * Reset returns to the whole architecture rather than to stage one.
 *
 * Under reduced motion the pulse along active edges is dropped and autoplay
 * dwells longer per stage; the walkthrough still works, it simply stops
 * moving. Nothing is hidden behind an animation.
 */
export function ArchitectureExplorer() {
  const reduced = usePrefersReducedMotion();

  const [view, setView] = useState<View>("architecture");
  const [selectedId, setSelectedId] = useState<string>("aaconnect-intake-fallback");
  const [stageIndex, setStageIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [openFailure, setOpenFailure] = useState<string | null>(null);
  const [failureNodes, setFailureNodes] = useState<string[]>([]);

  // Default selection: AAConnect's intake, since the TSP role is the point.
  const selected = useMemo(
    () => ARCH_NODES.find((n) => n.id === selectedId) ?? ARCH_NODES[2]!,
    [selectedId],
  );

  const stage = stageIndex === null ? null : (LIFECYCLE[stageIndex] ?? null);

  /* --- autoplay ---------------------------------------------------- */
  useEffect(() => {
    if (!playing) return;
    const dwell = reduced ? 5200 : 3800;

    const timer = setTimeout(() => {
      setStageIndex((current) => {
        const next = (current ?? -1) + 1;
        if (next >= LIFECYCLE.length) {
          setPlaying(false);
          return current;
        }
        return next;
      });
    }, dwell);

    return () => clearTimeout(timer);
  }, [playing, stageIndex, reduced]);

  /* --- controls ----------------------------------------------------- */
  const play = useCallback(() => {
    setStageIndex((current) => (current === null ? 0 : current));
    setPlaying(true);
  }, []);
  const pause = useCallback(() => setPlaying(false), []);
  const restart = useCallback(() => {
    setStageIndex(0);
    setPlaying(true);
  }, []);
  const reset = useCallback(() => {
    setPlaying(false);
    setStageIndex(null);
    setFailureNodes([]);
    setOpenFailure(null);
  }, []);
  const goTo = useCallback((index: number) => {
    setPlaying(false);
    setStageIndex(index);
  }, []);
  const previous = useCallback(() => {
    setPlaying(false);
    setStageIndex((current) => (current === null ? 0 : Math.max(0, current - 1)));
  }, []);
  const next = useCallback(() => {
    setPlaying(false);
    setStageIndex((current) =>
      current === null ? 0 : Math.min(LIFECYCLE.length - 1, current + 1),
    );
  }, []);

  /* --- what is emphasised right now ---------------------------------- */
  const activeNodes = useMemo(() => {
    if (failureNodes.length > 0) return new Set(failureNodes);
    return new Set(stage?.nodes ?? []);
  }, [stage, failureNodes]);

  const activeEdges = useMemo(() => new Set(stage?.edges ?? []), [stage]);

  const atFirst = stageIndex === null || stageIndex === 0;
  const atLast = stageIndex === LIFECYCLE.length - 1;
  const progress = stageIndex === null ? 0 : ((stageIndex + 1) / LIFECYCLE.length) * 100;

  /** A failure scenario focusing components also jumps the canvas into view. */
  const focusFailure = useCallback((nodes: string[], stageNumber: number) => {
    setFailureNodes(nodes);
    setPlaying(false);
    setStageIndex(stageNumber > 0 ? stageNumber - 1 : null);
  }, []);

  return (
    <div className="min-w-0 space-y-4">
      {/* ═══════════════ view switcher ═══════════════ */}
      <div
        role="tablist"
        aria-label="Architecture views"
        className="flex flex-wrap items-center gap-2"
      >
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={view === item.id}
            aria-controls={`view-${item.id}`}
            onClick={() => setView(item.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
              view === item.id
                ? "border-azure-500/50 bg-azure-500/12 text-azure-300"
                : "border-ink-600/80 bg-ink-850/50 text-mist-400 hover:border-ink-500 hover:text-mist-200",
            )}
          >
            <Icon name={item.icon} size={14} />
            {item.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ lifecycle controls ═══════════════ */}
      {view !== "failures" && (
        <div className="surface-card p-3 md:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={playing ? pause : play}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                playing
                  ? "border-azure-500/50 bg-azure-500/12 text-azure-300"
                  : "border-azure-500/40 bg-gradient-to-br from-azure-500/18 to-iris-500/18 text-mist-100 hover:border-azure-500/60",
              )}
              aria-describedby="lifecycle-live"
            >
              <Icon name={playing ? "Pause" : "Play"} size={14} />
              {playing ? "Pause" : "Play complete request lifecycle"}
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={previous}
                disabled={atFirst}
                aria-label="Previous stage"
                className="grid h-9 w-9 place-items-center rounded-lg border border-ink-600 text-mist-300 transition-colors enabled:hover:border-azure-500/50 enabled:hover:text-white disabled:opacity-35"
              >
                <Icon name="ChevronLeft" size={15} />
              </button>
              <button
                type="button"
                onClick={next}
                disabled={atLast}
                aria-label="Next stage"
                className="grid h-9 w-9 place-items-center rounded-lg border border-ink-600 text-mist-300 transition-colors enabled:hover:border-azure-500/50 enabled:hover:text-white disabled:opacity-35"
              >
                <Icon name="ChevronRight" size={15} />
              </button>
              <button
                type="button"
                onClick={restart}
                aria-label="Restart from stage one"
                className="grid h-9 w-9 place-items-center rounded-lg border border-ink-600 text-mist-300 transition-colors hover:border-azure-500/50 hover:text-white"
              >
                <Icon name="RotateCcw" size={14} />
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {stage && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-1.5 text-xs text-mist-400 transition-colors hover:border-ink-500 hover:text-mist-200"
                >
                  <Icon name="X" size={12} />
                  Show full architecture
                </button>
              )}
            </div>
          </div>

          {/* --- direct stage selection --- */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {LIFECYCLE.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(index)}
                aria-pressed={index === stageIndex}
                aria-label={`Stage ${item.number}: ${item.title}`}
                title={`${item.number}. ${item.title}`}
                className={cn(
                  "h-7 w-7 rounded-md border font-mono text-label transition-colors",
                  index === stageIndex
                    ? "border-azure-500/60 bg-azure-500/15 text-azure-300"
                    : "border-ink-600/80 bg-ink-850/50 text-mist-500 hover:border-ink-500 hover:text-mist-300",
                )}
              >
                {item.number}
              </button>
            ))}
          </div>

          {/* --- progress --- */}
          <div className="mt-3" aria-hidden="true">
            <div className="h-0.5 overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-azure-500 to-iris-400 transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p
            id="lifecycle-live"
            aria-live="polite"
            className="sr-only"
          >
            {stage
              ? `Stage ${stage.number} of ${LIFECYCLE.length}: ${stage.title}. ${stage.actor} to ${stage.destination}. ${stage.description}`
              : "Showing the complete architecture. No stage selected."}
          </p>
        </div>
      )}

      {/* ═══════════════ current stage ═══════════════ */}
      {stage && view !== "failures" && (
        <div className="rounded-xl border border-azure-500/30 bg-azure-500/[0.055] p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="eyebrow-sm text-azure-300">
              Stage {stage.number} of {LIFECYCLE.length}
            </span>
            <SourceBadge source={stage.source} size="sm" />
          </div>

          <h4 className="mt-2 font-display text-lg font-semibold text-mist-50">
            {stage.title}
          </h4>

          <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-label">
            <span className="rounded border border-ink-600 bg-ink-900/70 px-2 py-1 text-mist-300">
              {stage.actor}
            </span>
            <Icon name="ArrowRight" size={12} className="text-mist-600" />
            <span className="rounded border border-ink-600 bg-ink-900/70 px-2 py-1 text-mist-300">
              {stage.destination}
            </span>
            <span
              className="ml-1 rounded px-2 py-1"
              style={{
                color: EDGE_STYLE[stage.interaction].stroke,
                background: `${EDGE_STYLE[stage.interaction].stroke}14`,
              }}
            >
              {EDGE_LEGEND.find((l) => l.kind === stage.interaction)?.label}
            </span>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-mist-300">{stage.description}</p>

          {stage.operations && stage.operations.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {stage.operations.map((op) => (
                <li key={op}>
                  <code className="rounded border border-ink-600 bg-ink-950/60 px-2 py-1 font-mono text-label text-azure-300">
                    {op}
                  </code>
                </li>
              ))}
            </ul>
          )}

          {stage.risk && (
            <p className="mt-3 flex items-start gap-2 border-t border-ink-700/60 pt-3 text-xs leading-relaxed text-mist-400">
              <Icon
                name="TriangleAlert"
                size={12}
                className="mt-0.5 shrink-0 text-amber-glow"
              />
              {stage.risk}
            </p>
          )}
        </div>
      )}

      {/* ═══════════════ views ═══════════════ */}
      {/* The canvas spans the full width rather than sharing a row with the
          detail panel. An 1,100-unit-wide diagram with eleven labelled boxes
          needs the room: side by side it was forced into ~800px and scrolled
          horizontally on every laptop, which is a worse trade than reading the
          component panel a scroll further down. */}
      <div className="min-w-0 space-y-4">
        <div className="surface-card min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-ink-700/70 px-4 py-2.5">
            <span className="eyebrow-sm text-mist-500">
              {view === "architecture"
                ? "Illustrative architecture"
                : view === "sequence"
                  ? "Request lifecycle · ordered in time"
                  : "Failure paths"}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded border border-ink-600 bg-ink-850 px-2 py-1 font-mono text-micro text-mist-500"
              title="A high-level illustrative representation of engineering responsibilities, built from the public ReBIT specifications. Not a reproduction of any production architecture."
            >
              <Icon name="Info" size={10} />
              illustrative · not production
            </span>
          </div>

          <div id={`view-${view}`} role="tabpanel">
            {view === "architecture" && (
              <ArchitectureCanvas
                selectedId={selected.id}
                onSelect={(id) => {
                  setSelectedId(id);
                  setFailureNodes([]);
                }}
                activeNodes={activeNodes}
                activeEdges={activeEdges}
                reducedMotion={reduced}
              />
            )}
            {view === "sequence" && (
              <SequenceDiagram
                activeStage={stage?.number ?? null}
                onSelectStage={(n) => goTo(n - 1)}
              />
            )}
            {view === "failures" && (
              <FailureExplorer
                openId={openFailure}
                onToggle={setOpenFailure}
                onFocusNodes={focusFailure}
              />
            )}
          </div>

          {/* --- legend --- */}
          {view !== "failures" && (
            <div className="border-t border-ink-700/70 px-4 py-3">
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {EDGE_LEGEND.map((entry) => {
                  const style = EDGE_STYLE[entry.kind];
                  return (
                    <li
                      key={entry.kind}
                      title={entry.note}
                      className="inline-flex items-center gap-2 font-mono text-micro text-mist-500"
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
          )}
        </div>

        {/* ═══════════════ detail panel ═══════════════ */}
        <div className="grid items-start gap-4 lg:grid-cols-[1.7fr_1fr]">
          {view === "failures" ? (
            <ZoneKey />
          ) : (
            <>
              <div className="surface-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="eyebrow-sm text-mist-500">
                    Component
                  </p>
                  <SourceBadge source={selected.source} size="sm" />
                </div>

                <h4 className="mt-2 flex items-center gap-2.5 font-display text-lg font-semibold text-mist-50">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: NODE_STYLE[selected.kind].accent }}
                  />
                  {selected.label}
                </h4>

                <p className="mt-1 font-mono text-micro tracking-wide text-mist-600">
                  {ZONES.find((z) => z.id === selected.zone)?.label}
                </p>

                <dl className="mt-4 space-y-3 border-t border-ink-700/60 pt-4">
                  <Field label="Responsibility" value={selected.responsibility} />
                  <Field label="Incoming" value={selected.incoming} />
                  <Field label="Outgoing" value={selected.outgoing} />
                  <Field label="Protocol phase" value={selected.phase} />
                </dl>

                <div className="mt-4 space-y-3 border-t border-ink-700/60 pt-4">
                  {selected.detail.map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-caption leading-relaxed text-mist-400"
                      // Bold markers in the copy are authored, not user input.
                      dangerouslySetInnerHTML={{
                        __html: paragraph.replace(
                          /\*\*(.+?)\*\*/g,
                          '<strong class="font-semibold text-mist-200">$1</strong>',
                        ),
                      }}
                    />
                  ))}
                </div>

                {selected.operations && selected.operations.length > 0 && (
                  <ul className="mt-4 space-y-1.5 border-t border-ink-700/60 pt-4">
                    {selected.operations.map((op) => (
                      <li key={op}>
                        <code className="font-mono text-label text-azure-300">{op}</code>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 border-t border-ink-700/60 pt-4">
                  <p className="eyebrow-sm text-mist-600">
                    Failure conditions
                  </p>
                  <ul className="mt-2 space-y-2">
                    {selected.failures.map((item, index) => (
                      <li key={index} className="flex gap-2.5">
                        <Icon
                          name="TriangleAlert"
                          size={11}
                          className="mt-1 shrink-0 text-amber-glow/80"
                        />
                        <span className="text-xs leading-relaxed text-mist-400">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

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

              <ZoneKey />
            </>
          )}
        </div>
      </div>

      {/* ═══════════════ provenance ═══════════════ */}
      <div className="surface-inset p-4">
        <p className="eyebrow-sm text-mist-600">
          Protocol sources
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {SPEC_REFERENCES.map((ref) => (
            <li key={ref.url} className="text-xs leading-relaxed">
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-azure-300 underline decoration-azure-500/40 underline-offset-4 transition-colors hover:text-azure-400"
              >
                {ref.label}
              </a>
              <span className="text-mist-600"> — {ref.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow-sm text-mist-600">
        {label}
      </dt>
      <dd className="mt-1 text-caption leading-relaxed text-mist-300">{value}</dd>
    </div>
  );
}

/** Who owns what — the distinction the whole case study turns on. */
function ZoneKey() {
  return (
    <div className="surface-card p-5">
      <p className="eyebrow-sm text-mist-500">
        Ownership
      </p>
      <ul className="mt-3 space-y-3">
        {ZONES.map((zone) => (
          <li key={zone.id} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: zone.accent, opacity: 0.8 }}
            />
            <span>
              <span className="block text-xs font-medium text-mist-200">{zone.label}</span>
              <span className="mt-0.5 block text-label leading-relaxed text-mist-500">
                {zone.note}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
