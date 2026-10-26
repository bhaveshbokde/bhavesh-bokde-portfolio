"use client";

import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/types";
import { usePointerTilt } from "@/hooks/usePointerTilt";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { Tag } from "./Tag";
import { KindBadge, StatusBadge } from "./StatusBadge";

const ACCENT = {
  blue: "#5b9cff",
  violet: "#a98bff",
  cyan: "#4fd1e0",
  amber: "#f0b35b",
  emerald: "#4ad6a0",
} as const;

/**
 * The large, alternating feature presentation.
 *
 * Used for the projects that carry the most engineering weight. The diagram
 * and the copy swap sides down the page, which does two things: it stops a
 * list of features reading as a repeating template, and it gives the eye a
 * reason to keep moving rather than settling into a column scan.
 *
 * Interaction notes:
 *
 * - The title is the only link. An earlier version stretched a click target
 *   across the whole card, which conflicted with the repository link nested
 *   inside it — two overlapping destinations, one of them invisible. The
 *   hover affordances still cover the whole surface, so it reads as one
 *   object while remaining unambiguous to click and to tab through.
 * - Tilt is pointer-only and reduced-motion-aware, and the glare follows the
 *   pointer through CSS custom properties the tilt hook writes.
 * - `group-focus-within` mirrors every hover state, so arriving by keyboard
 *   shows exactly what arriving by mouse shows.
 */
export function FeatureProject({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const tiltRef = usePointerTilt<HTMLDivElement>({ maxTilt: 3.5, lift: 5 });
  const repository = project.links?.find((l) => l.kind === "repository");
  const demo = project.links?.find((l) => l.kind === "demo");
  const accent = ACCENT[project.accent ?? "blue"];
  const flipped = index % 2 === 1;

  return (
    <article className="group grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
      {/* ───── visual ───── */}
      <div
        className={cn(
          "lg:col-span-7",
          flipped ? "lg:order-2" : "lg:order-1",
        )}
      >
        <div
          ref={tiltRef}
          className="relative transition-transform duration-500 ease-out will-change-transform"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            aria-hidden="true"
            className="absolute -inset-4 rounded-panel opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-70 group-focus-within:opacity-70"
            style={{
              background: `radial-gradient(55% 55% at var(--tilt-x,50%) var(--tilt-y,50%), ${accent}22, transparent 70%)`,
            }}
          />

          <div className="relative overflow-hidden rounded-panel border border-ink-600/70 bg-ink-900/70 shadow-[var(--shadow-card)] transition-colors duration-500 group-hover:border-ink-500 group-focus-within:border-ink-500">
            {/* Light along the top edge, tracking the pointer. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100"
              style={{
                background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
              }}
            />

            {project.preview ? (
              <div className="relative aspect-[16/10] bg-ink-950/40">
                <Image
                  src={project.preview}
                  alt={project.previewAlt ?? `${project.name} architecture diagram`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover object-top transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="bg-dots grid aspect-[16/10] place-items-center">
                <span className="font-display text-4xl font-semibold text-mist-600">
                  {project.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───── copy ───── */}
      <div
        className={cn(
          "lg:col-span-5",
          flipped ? "lg:order-1" : "lg:order-2",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind={project.kind} />
          <StatusBadge status={project.status} />
        </div>

        <p className="mt-4 eyebrow-sm text-mist-600">{project.category}</p>

        <h3 className="mt-2 font-display text-2xl leading-tight font-semibold md:text-3xl">
          <Link
            href={`/projects/${project.slug}`}
            className="group/link inline-flex items-start gap-2 text-mist-50 transition-colors hover:text-white"
          >
            <span
              className="bg-gradient-to-r from-current to-current bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover/link:bg-[length:100%_1px]"
              style={{ paddingBottom: "0.12em" }}
            >
              {project.name}
            </span>
            <Icon
              name="ArrowUpRight"
              size={18}
              className="mt-1.5 shrink-0 text-mist-500 transition-transform duration-300 motion-safe:group-hover/link:translate-x-0.5 motion-safe:group-hover/link:-translate-y-0.5"
            />
          </Link>
        </h3>

        <p className="mt-4 text-body leading-[1.7] text-mist-400">{project.summary}</p>

        {/* Verified figures only — each carries its source on hover. */}
        {project.metrics && project.metrics.length > 0 && (
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-ink-700/60 pt-5">
            {project.metrics.slice(0, 3).map((metric) => (
              <div key={metric.label}>
                <dt className="eyebrow-sm text-mist-600">{metric.label}</dt>
                <dd
                  className="mt-1 font-display text-base font-semibold text-mist-100"
                  title={metric.source}
                >
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <ul className="mt-6 flex flex-wrap gap-1.5">
          {project.stack.slice(0, 6).map((tech) => (
            <li key={tech}>
              <Tag>{tech}</Tag>
            </li>
          ))}
          {project.stack.length > 6 && (
            <li>
              <Tag variant="muted">+{project.stack.length - 6}</Tag>
            </li>
          )}
        </ul>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-2 rounded-control text-sm font-medium text-azure-300 transition-colors hover:text-azure-400"
          >
            {project.caseStudy ? "Read the case study" : "View details"}
            <Icon
              name="ArrowRight"
              size={14}
              className="transition-transform duration-300 motion-safe:group-hover:translate-x-0.5"
            />
          </Link>

          {demo?.url && (
            <a
              href={demo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-control text-sm text-mist-400 transition-colors hover:text-mist-100"
            >
              <Icon name="ExternalLink" size={14} />
              Live demo
            </a>
          )}

          {repository?.url && (
            <a
              href={repository.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.name} repository on GitHub (opens in a new tab)`}
              className="inline-flex items-center gap-1.5 rounded-control text-sm text-mist-400 transition-colors hover:text-mist-100"
            >
              <Icon name="GitHub" size={14} />
              Repository
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
