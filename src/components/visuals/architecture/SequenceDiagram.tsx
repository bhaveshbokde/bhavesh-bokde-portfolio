"use client";

import {
  SEQUENCE,
  SEQUENCE_PARTICIPANTS,
  SOURCE_LABEL,
  type SequenceMessage,
} from "@/data/architecture";
import { cn } from "@/lib/utils";
import { EDGE_STYLE, NODE_STYLE } from "./style";
import { SourceBadge } from "./SourceBadge";

export interface SequenceDiagramProps {
  /** Highlight only messages belonging to this stage. Null shows all equally. */
  activeStage: number | null;
  onSelectStage: (stage: number) => void;
}

const LANE_X = [100, 290, 500, 720, 920, 1110];
const TOP = 72;
const ROW = 34;

/**
 * A chronological sequence diagram over the same data as the canvas.
 *
 * This view exists because an architecture diagram cannot express *ordering*,
 * and ordering is the whole point here: `POST /Consent` returns and the
 * connection closes long before the user has decided anything. The two
 * notifications arrive later as new inbound calls. Drawn on a time axis that
 * is impossible to misread; drawn as boxes and arrows it is almost impossible
 * to read correctly.
 *
 * Messages are rendered from `SEQUENCE`, which shares its `EdgeKind` vocabulary
 * with the canvas — so a notification is amber dashed in both places and the
 * two views cannot contradict each other.
 *
 * On narrow screens the SVG is replaced by an ordered list of the same
 * messages, which is genuinely readable on a phone in a way that six lanes
 * are not.
 */
export function SequenceDiagram({ activeStage, onSelectStage }: SequenceDiagramProps) {
  const laneOf = (id: string) => {
    const index = SEQUENCE_PARTICIPANTS.findIndex((p) => p.id === id);
    return LANE_X[index] ?? LANE_X[0]!;
  };

  const height = TOP + SEQUENCE.length * ROW + 46;

  return (
    <>
      {/* ═══════════════ desktop ═══════════════ */}
      <div className="hidden overflow-x-auto p-3 md:block md:p-4">
        <svg
          viewBox={`0 0 1200 ${height}`}
          className="h-auto w-full min-w-[900px]"
          role="group"
          aria-label="Sequence diagram of the AAConnect request lifecycle, ordered in time across six participants."
        >
          <defs>
            {Object.entries(EDGE_STYLE).map(([kind, s]) => (
              <marker
                key={kind}
                id={`sq-arrow-${kind}`}
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

          {/* ---- participant lanes ---- */}
          {SEQUENCE_PARTICIPANTS.map((participant, index) => {
            const x = LANE_X[index]!;
            const accent = NODE_STYLE[participant.kind].accent;
            return (
              <g key={participant.id}>
                <rect
                  x={x - 74}
                  y={18}
                  width={148}
                  height={34}
                  rx="9"
                  fill="#141821"
                  stroke={accent}
                  strokeOpacity="0.45"
                />
                <text
                  x={x}
                  y={39}
                  textAnchor="middle"
                  fill="#e2e7f2"
                  fontSize="11.5"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                >
                  {participant.label}
                </text>
                <line
                  x1={x}
                  y1={52}
                  x2={x}
                  y2={height - 24}
                  stroke={accent}
                  strokeOpacity="0.18"
                  strokeWidth="1.5"
                  strokeDasharray="3 5"
                />
              </g>
            );
          })}

          {/* ---- messages ---- */}
          {SEQUENCE.map((message, index) => {
            const y = TOP + index * ROW;
            const style = EDGE_STYLE[message.kind];
            const active = activeStage === null || activeStage === message.stage;
            const from = laneOf(message.from);
            const to = laneOf(message.to);

            return (
              <g
                key={message.id}
                opacity={active ? 1 : 0.16}
                className="cursor-pointer"
                onClick={() => onSelectStage(message.stage)}
              >
                {message.self ? (
                  /* Self-call: a bracket off the lane, not an arrow across it. */
                  <>
                    <path
                      d={`M ${from} ${y - 9} H ${from + 46} V ${y + 9} H ${from}`}
                      fill="none"
                      stroke={style.stroke}
                      strokeWidth={style.width}
                      strokeDasharray={style.dash}
                      markerEnd={`url(#sq-arrow-${message.kind})`}
                    />
                    <text
                      x={from + 56}
                      y={y + 4}
                      fill="#a3adc4"
                      fontSize="10.5"
                      fontFamily="ui-monospace, monospace"
                    >
                      {message.label}
                    </text>
                  </>
                ) : (
                  <>
                    <line
                      x1={from}
                      y1={y}
                      x2={to}
                      y2={y}
                      stroke={style.stroke}
                      strokeWidth={style.width}
                      strokeDasharray={style.dash}
                      markerEnd={`url(#sq-arrow-${message.kind})`}
                    />
                    <text
                      x={(from + to) / 2}
                      y={y - 7}
                      textAnchor="middle"
                      fill="#a3adc4"
                      fontSize="10.5"
                      fontFamily="ui-monospace, monospace"
                    >
                      {message.label}
                    </text>
                  </>
                )}

                {/* Stage number in the gutter. */}
                <text
                  x={16}
                  y={y + 4}
                  fill="#4e566b"
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                >
                  {String(message.stage).padStart(2, "0")}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ═══════════════ mobile ═══════════════ */}
      <ol className="divide-y divide-ink-700/50 md:hidden">
        {SEQUENCE.map((message) => (
          <MobileMessage
            key={message.id}
            message={message}
            active={activeStage === null || activeStage === message.stage}
            onSelect={() => onSelectStage(message.stage)}
          />
        ))}
      </ol>
    </>
  );
}

function MobileMessage({
  message,
  active,
  onSelect,
}: {
  message: SequenceMessage;
  active: boolean;
  onSelect: () => void;
}) {
  const style = EDGE_STYLE[message.kind];
  const fromLabel =
    SEQUENCE_PARTICIPANTS.find((p) => p.id === message.from)?.short ?? message.from;
  const toLabel =
    SEQUENCE_PARTICIPANTS.find((p) => p.id === message.to)?.short ?? message.to;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left transition-opacity",
          !active && "opacity-40",
        )}
      >
        <span
          aria-hidden="true"
          className="mt-1 h-2 w-2 shrink-0 rounded-full"
          style={{ background: style.stroke }}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-mono text-[10px] text-mist-600">
            <span>stage {String(message.stage).padStart(2, "0")}</span>
            <span aria-hidden="true">·</span>
            <span>
              {message.self ? `${fromLabel} (internal)` : `${fromLabel} → ${toLabel}`}
            </span>
          </span>
          <span className="mt-1 block font-mono text-xs leading-snug text-mist-200">
            {message.label}
          </span>
          <span className="mt-1.5 block">
            <SourceBadge source={message.source} size="sm" />
          </span>
        </span>
      </button>
    </li>
  );
}

export { SOURCE_LABEL };
