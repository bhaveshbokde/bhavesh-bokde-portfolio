import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/types";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { Tag } from "./Tag";
import { KindBadge, StatusBadge } from "./StatusBadge";

const ACCENTS = {
  blue: "from-azure-500/18 via-azure-500/5",
  violet: "from-iris-500/18 via-iris-500/5",
  cyan: "from-aqua-400/18 via-aqua-400/5",
  amber: "from-amber-glow/18 via-amber-glow/5",
  emerald: "from-jade-400/18 via-jade-400/5",
} as const;

/** "E-commerce Backend" → "EB". Used on the placeholder panel. */
function initials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * A project card.
 *
 * The whole card is a link to the detail page, implemented with a stretched
 * overlay anchor rather than by wrapping everything in an `<a>` — nesting the
 * repository link inside an outer anchor would be invalid HTML and the inner
 * link would be unreachable. The repository link sits above the overlay with
 * `relative z-10`, so both targets work with a mouse and both appear in the
 * tab order exactly once.
 *
 * A `preview` is optional. Without one the card renders a typographic panel
 * instead of leaving a hole, and nothing here ever substitutes a stock photo
 * for a screenshot of software that does not look like that.
 */
export function ProjectCard({ project }: { project: Project }) {
  const repositoryLink = project.links?.find((link) => link.kind === "repository");
  const demoLink = project.links?.find((link) => link.kind === "demo");
  const accent = ACCENTS[project.accent ?? "blue"];

  return (
    <article
      className={cn(
        "group surface-card relative flex h-full flex-col overflow-hidden",
        "transition-[transform,border-color,box-shadow] duration-500",
        "motion-safe:hover:-translate-y-1 hover:border-ink-500",
        "hover:shadow-[0_24px_60px_-28px_rgb(0_0_0/0.9)]",
      )}
    >
      {/* Accent wash, only on hover. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100",
          accent,
        )}
      />

      {/* ---------------- preview ---------------- */}
      <div className="relative aspect-[16/10] overflow-hidden border-b border-ink-700/70 bg-ink-950/60">
        {project.preview ? (
          <Image
            src={project.preview}
            alt={project.previewAlt ?? `${project.name} — diagram`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover object-center transition-transform duration-700 motion-safe:group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          // No preview configured. The panel shows the initials and the
          // category rather than the project name: the name is already the
          // card's heading immediately below, and repeating it makes a screen
          // reader announce the same words twice for one card.
          <div aria-hidden="true" className="bg-dots grid h-full place-items-center">
            <span className="font-display text-4xl font-semibold tracking-tight text-mist-600">
              {initials(project.name)}
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-1.5">
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* ---------------- body ---------------- */}
      <div className="relative flex flex-1 flex-col p-5 md:p-6">
        <div className="flex items-center gap-2">
          <KindBadge kind={project.kind} />
        </div>

        <h3 className="mt-3.5 font-display text-lg font-semibold text-mist-50">
          <Link
            href={`/projects/${project.slug}`}
            className="before:absolute before:inset-0 before:content-['']"
          >
            {project.name}
          </Link>
        </h3>

        <p className="mt-1 font-mono text-[11px] tracking-wide text-mist-500">
          {project.category}
        </p>

        <p className="mt-3.5 flex-1 text-sm leading-relaxed text-mist-400">
          {project.summary}
        </p>

        {/* --- metrics --- */}
        {project.metrics && project.metrics.length > 0 && (
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-ink-700/60 pt-4">
            {project.metrics.slice(0, 2).map((metric) => (
              <div key={metric.label}>
                <dt className="font-mono text-[10px] tracking-[0.16em] text-mist-600 uppercase">
                  {metric.label}
                </dt>
                <dd
                  className="mt-0.5 text-sm font-medium text-mist-100"
                  title={metric.source}
                >
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* --- stack --- */}
        <ul className="mt-5 flex flex-wrap gap-1.5">
          {project.stack.slice(0, 5).map((technology) => (
            <li key={technology}>
              <Tag>{technology}</Tag>
            </li>
          ))}
          {project.stack.length > 5 && (
            <li>
              <Tag variant="muted">+{project.stack.length - 5}</Tag>
            </li>
          )}
        </ul>

        {/* --- links --- */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-ink-700/60 pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-azure-300 transition-colors group-hover:text-azure-400">
            {project.caseStudy ? "Read case study" : "View details"}
            <Icon
              name="ArrowRight"
              size={13}
              className="transition-transform duration-300 motion-safe:group-hover:translate-x-0.5"
            />
          </span>

          <div className="relative z-10 flex items-center gap-1">
            {demoLink?.url && (
              <a
                href={demoLink.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.name} live demo (opens in a new tab)`}
                className="grid h-8 w-8 place-items-center rounded-lg border border-ink-600 text-mist-400 transition-colors hover:border-azure-500/50 hover:text-white"
              >
                <Icon name="ExternalLink" size={14} />
              </a>
            )}
            {repositoryLink?.url && (
              <a
                href={repositoryLink.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.name} repository on GitHub (opens in a new tab)`}
                className="grid h-8 w-8 place-items-center rounded-lg border border-ink-600 text-mist-400 transition-colors hover:border-azure-500/50 hover:text-white"
              >
                <Icon name="GitHub" size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
