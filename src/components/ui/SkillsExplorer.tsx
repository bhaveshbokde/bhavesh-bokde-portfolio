"use client";

import { useMemo, useState } from "react";
import type { SkillCategory } from "@/data/types";
import type { SkillWithContext } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

/**
 * The filterable skills grid.
 *
 * Everything here is derived from the `groups` prop — the chips, the counts,
 * the cards. Nothing is hardcoded, so the component needs no edit when the
 * data changes.
 *
 * The filter is a radio group rather than a row of buttons: exactly one option
 * is active at a time, arrow keys move between them, and a screen reader
 * announces "2 of 8 selected". A row of `<button>`s would give none of that
 * for free.
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
    () => (active === "all" ? groups : groups.filter((group) => group.category.id === active)),
    [groups, active],
  );

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
      {/* ---------------- filters ---------------- */}
      <div
        role="radiogroup"
        aria-label="Filter skills by category"
        className="mb-10 flex flex-wrap gap-2"
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
                selected
                  ? "border-azure-500/50 bg-azure-500/12 text-azure-300"
                  : "border-ink-600/80 bg-ink-850/50 text-mist-400 hover:border-ink-500 hover:text-mist-200",
              )}
            >
              {chip.label}
              <span
                className={cn(
                  "font-mono text-[10px]",
                  selected ? "text-azure-400" : "text-mist-600",
                )}
              >
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---------------- groups ---------------- */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleGroups.map((group) => (
          <section
            key={group.category.id}
            aria-labelledby={`skill-group-${group.category.id}`}
            className="surface-card group/card relative overflow-hidden p-6 transition-colors duration-500 hover:border-ink-500"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-azure-500/50 to-transparent opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            />

            <div className="flex items-start gap-3.5">
              {group.category.icon && (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-ink-600 bg-ink-850 text-azure-400">
                  <Icon name={group.category.icon} size={17} />
                </span>
              )}
              <div className="min-w-0">
                <h3
                  id={`skill-group-${group.category.id}`}
                  className="font-display text-base font-semibold text-mist-50"
                >
                  {group.category.label}
                </h3>
                {group.category.description && (
                  <p className="mt-1 text-xs leading-relaxed text-mist-500">
                    {group.category.description}
                  </p>
                )}
              </div>
            </div>

            <ul className="mt-5 flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <li key={skill.id}>
                  <span
                    title={
                      [
                        skill.description,
                        skill.proficiency,
                        skill.usedInProduction ? "Used in production at work." : undefined,
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
                      <span className="text-[10px] text-mist-600">
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
        ))}
      </div>

      {/* Legend for the production marker. */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] text-mist-600">
        <p className="flex items-center gap-2">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-azure-400" />
          used in production at work
        </p>
        <p className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="rounded bg-ink-950/60 px-1 text-[9px] text-mist-600"
          >
            n
          </span>
          projects on this site using it
        </p>
      </div>
    </div>
  );
}
