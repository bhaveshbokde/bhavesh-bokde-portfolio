"use client";

import { useMemo, useState } from "react";
import type { SkillCategory } from "@/data/types";
import type { SkillWithContext } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

/**
 * The filterable skills index.
 *
 * Laid out as a specification sheet rather than a grid of cards: one row per
 * category, the category named on the left, its technologies flowing across
 * the right, hairlines between. Cards forced every category into the same
 * rectangle regardless of whether it held three entries or twelve, which meant
 * either a lot of dead space or a chip list spilling past its box. A row takes
 * exactly the height its contents need, and the whole thing reads top to
 * bottom like a datasheet — which is roughly how an engineer reads it anyway.
 *
 * Everything is derived from the `groups` prop — the chips, the counts, the
 * rows. Nothing is hardcoded, so the component needs no edit when the data
 * changes.
 *
 * The filter is a radio group rather than a row of buttons: exactly one option
 * is active at a time, arrow keys move between them, and a screen reader
 * announces "2 of 8 selected". A row of `<button>`s would give none of that
 * for free.
 *
 * There are no percentage bars, star ratings or expert/intermediate levels.
 * The only claim attached to a technology is whether the day job puts it into
 * production, and how many projects on this site use it — and that count is
 * derived from each project's own stack, so it cannot overstate.
 */
export interface SkillsExplorerGroup {
  category: SkillCategory;
  skills: SkillWithContext[];
}

export function SkillsExplorer({ groups }: { groups: SkillsExplorerGroup[] }) {
  const [active, setActive] = useState<string>("all");

  const totalCount = useMemo(
    () => groups.reduce((count, group) => count + group.skills.length, 0),
    [groups],
  );

  const visibleGroups = useMemo(
    () =>
      active === "all"
        ? groups
        : groups.filter((group) => group.category.id === active),
    [groups, active],
  );

  /* The legend's count key. Taken from the data — the highest count any chip
     actually shows — so the example in the legend matches something visible
     on the page rather than being a made-up digit. */
  const exampleCount = useMemo(() => {
    const highest = Math.max(
      0,
      ...groups.flatMap((group) => group.skills.map((s) => s.projects.length)),
    );
    return highest > 0 ? highest : 1;
  }, [groups]);

  const chips = [
    { id: "all", label: "All", count: totalCount },
    ...groups.map((group) => ({
      id: group.category.id,
      label: group.category.label,
      count: group.skills.length,
    })),
  ];

  return (
    <div>
      {/* ───────────── filters ───────────── */}
      <div
        role="radiogroup"
        aria-label="Filter skills by category"
        className="mb-12 flex flex-wrap gap-2"
      >
        {chips.map((chip) => {
          const selected = active === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setActive(chip.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all duration-300",
                "active:scale-[0.97] active:duration-75",
                selected
                  ? "border-azure-500/50 bg-azure-500/12 text-azure-300 shadow-[0_0_0_1px_rgb(91_156_255_/_0.08)]"
                  : "border-ink-600/80 bg-ink-850/50 text-mist-400 hover:border-ink-500 hover:bg-ink-850 hover:text-mist-200",
              )}
            >
              {chip.label}
              <span
                className={cn(
                  "font-mono text-micro tabular-nums",
                  selected ? "text-azure-400" : "text-mist-600",
                )}
              >
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ───────────── rows ───────────── */}
      <div className="border-t border-ink-800">
        {visibleGroups.map((group) => {
          // Indexed against the full list, not the filtered one, so a
          // category keeps the same number whichever filter is active.
          const index = groups.findIndex((g) => g.category.id === group.category.id);

          return (
            <section
              key={group.category.id}
              aria-labelledby={`skill-group-${group.category.id}`}
              className="group/row grid gap-x-10 gap-y-5 border-b border-ink-800 py-7 transition-colors duration-500 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:py-8"
            >
              {/* --- category --- */}
              <div className="flex items-start gap-3.5">
                <span
                  aria-hidden="true"
                  className="pt-0.5 font-mono text-label text-mist-600 tabular-nums transition-colors duration-500 group-hover/row:text-azure-400"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0">
                  <h3
                    id={`skill-group-${group.category.id}`}
                    className="flex items-center gap-2 font-display text-base font-semibold text-mist-50"
                  >
                    {group.category.icon && (
                      <Icon
                        name={group.category.icon}
                        size={15}
                        className="shrink-0 text-azure-400"
                      />
                    )}
                    {group.category.label}
                  </h3>

                  {group.category.description && (
                    <p className="mt-1.5 text-caption leading-relaxed text-mist-500">
                      {group.category.description}
                    </p>
                  )}
                </div>
              </div>

              {/* --- technologies --- */}
              <ul className="flex flex-wrap content-start gap-2">
                {group.skills.map((skill) => (
                  <li key={skill.id}>
                    <span
                      title={
                        [
                          skill.description,
                          skill.proficiency,
                          skill.usedInProduction
                            ? "Used in production at work."
                            : undefined,
                          skill.projects.length > 0
                            ? `In: ${skill.projects.map((p) => p.name).join(", ")}`
                            : undefined,
                        ]
                          .filter(Boolean)
                          .join(" · ") || undefined
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-xs transition-colors duration-300",
                        skill.usedInProduction
                          ? "border-azure-500/25 bg-azure-500/[0.07] text-mist-200 hover:border-azure-500/50"
                          : "border-ink-600/70 bg-ink-800/60 text-mist-400 hover:border-ink-500 hover:text-mist-200",
                      )}
                    >
                      {skill.usedInProduction && (
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full bg-azure-400"
                        />
                      )}
                      {skill.name}
                      {skill.proficiency && (
                        <span className="text-micro text-mist-600">
                          {skill.proficiency}
                        </span>
                      )}
                      {/* How many of my own projects actually use it. Derived
                          from each project's stack, so it cannot overstate. */}
                      {skill.projects.length > 0 && (
                        <span
                          className="rounded bg-ink-950/60 px-1 text-[9px] text-mist-600"
                          aria-label={`Used in ${skill.projects.length} project${skill.projects.length === 1 ? "" : "s"}`}
                        >
                          {skill.projects.length}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Legend for the two markers a chip can carry.
          The count key used to render a literal "n" next to the words
          "projects on this site using it", which read as an unsubstituted
          template variable rather than as a stand-in for a number. It now
          shows a real count from the data and says what it means in a
          sentence. */}
      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-label text-mist-500">
        <p className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-azure-400"
          />
          A dot marks a technology used in production at work
        </p>
        <p className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="rounded bg-ink-950/60 px-1 font-mono text-[9px] text-mist-500"
          >
            {exampleCount}
          </span>
          The number counts projects on this site that use it
        </p>
      </div>
    </div>
  );
}
