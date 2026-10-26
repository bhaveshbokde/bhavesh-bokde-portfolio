"use client";

import { FAILURES } from "@/data/architecture";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { SourceBadge } from "./SourceBadge";

export interface FailureExplorerProps {
  /** Currently opened scenario id, or null. */
  openId: string | null;
  onToggle: (id: string | null) => void;
  /** Lets a scenario drive the canvas highlight. */
  onFocusNodes: (nodes: string[], stage: number) => void;
}

/**
 * The failure explorer.
 *
 * Nine ways the lifecycle does not finish, ordered by the stage they occur in.
 * Worth building because the happy path is the easy half: anyone can draw a
 * request reaching a provider. What distinguishes a system that works in
 * production is what it does when the user walks away, the callback never
 * arrives, or the payload will not decrypt.
 *
 * Each scenario separates three things that are easy to conflate — the
 * **signal** the system observes, the **consequence** for the request, and the
 * **handling**. Handling is the part most likely to be wishful, so anything
 * not provable from the specification is badged *Illustrative* rather than
 * presented as guaranteed behaviour.
 */
export function FailureExplorer({
  openId,
  onToggle,
  onFocusNodes,
}: FailureExplorerProps) {
  return (
    <div className="p-3 md:p-4">
      <p className="mb-4 flex items-start gap-2 px-1 text-xs leading-relaxed text-mist-500">
        <Icon name="TriangleAlert" size={13} className="mt-0.5 shrink-0 text-amber-glow" />
        Selecting a scenario highlights the components it affects on the
        architecture view. Recovery behaviour is only stated where the
        specification or the implementation supports it — anything else is
        marked illustrative.
      </p>

      <ul className="space-y-2">
        {FAILURES.map((failure) => {
          const open = openId === failure.id;
          const panelId = `failure-panel-${failure.id}`;

          return (
            <li key={failure.id}>
              <div
                className={cn(
                  "overflow-hidden rounded-xl border transition-colors",
                  open
                    ? "border-amber-glow/35 bg-amber-glow/[0.045]"
                    : "border-ink-700/70 bg-ink-850/40 hover:border-ink-600",
                )}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => {
                    const next = open ? null : failure.id;
                    onToggle(next);
                    if (next) onFocusNodes(failure.nodes, failure.stage);
                    else onFocusNodes([], 0);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-lg border font-mono text-micro",
                      open
                        ? "border-amber-glow/40 bg-amber-glow/10 text-amber-glow"
                        : "border-ink-600 bg-ink-900 text-mist-500",
                    )}
                  >
                    {String(failure.stage).padStart(2, "0")}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-mist-100">
                      {failure.title}
                    </span>
                    <span className="mt-0.5 block font-mono text-micro text-mist-600">
                      stage {failure.stage} · {failure.stageTitle}
                    </span>
                  </span>

                  <SourceBadge source={failure.source} size="sm" className="hidden sm:inline-flex" />

                  <Icon
                    name="ChevronDown"
                    size={15}
                    className={cn(
                      "shrink-0 text-mist-500 transition-transform duration-300",
                      open && "rotate-180",
                    )}
                  />
                </button>

                {open && (
                  <dl id={panelId} className="space-y-3 border-t border-ink-700/60 px-4 py-4">
                    <div>
                      <dt className="eyebrow-sm text-mist-600">
                        Signal
                      </dt>
                      <dd className="mt-1 text-caption leading-relaxed text-mist-300">
                        {failure.signal}
                      </dd>
                    </div>
                    <div>
                      <dt className="eyebrow-sm text-mist-600">
                        Consequence
                      </dt>
                      <dd className="mt-1 text-caption leading-relaxed text-mist-300">
                        {failure.consequence}
                      </dd>
                    </div>
                    <div>
                      <dt className="eyebrow-sm text-mist-600">
                        Handling
                      </dt>
                      <dd className="mt-1 text-caption leading-relaxed text-mist-300">
                        {failure.handling}
                      </dd>
                    </div>
                    <div className="pt-1 sm:hidden">
                      <SourceBadge source={failure.source} size="sm" />
                    </div>
                  </dl>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
