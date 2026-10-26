import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { projects } from "@/data/projects";
import { siteConfig } from "@/data/site-config";
import { getProjectBySlug, getProjects } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Tag } from "@/components/ui/Tag";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { KindBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { ConfidentialityNotice } from "@/components/ui/ConfidentialityNotice";
import { ArchitectureExplorer } from "@/components/visuals/ArchitectureExplorer";
import { CaseStudyHero } from "@/components/sections/CaseStudyHero";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Pre-renders a static page per project at build time, so every detail page is
 * plain HTML with no runtime data fetching.
 */
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return { title: "Project not found", robots: { index: false, follow: false } };
  }

  return {
    title: project.name,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      title: `${project.name} — ${project.category}`,
      description: project.summary,
      url: `${siteConfig.url}/projects/${project.slug}`,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: project.name }],
    },
  };
}

interface BodyBlock {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

/** Metric-rail track, keyed by how many figures the project supplies. */
const METRIC_COLUMNS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

/**
 * One body section.
 *
 * Numbered and separated by a hairline, matching the `01 — About` rhythm the
 * homepage sections use, so a detail page reads as the same publication rather
 * than a different template that happens to share a palette. The number is
 * assigned after empty sections are filtered out, so the sequence has no gaps
 * in it regardless of how much content a given project supplies.
 */
function Block({ block, index }: { block: BodyBlock; index: number }) {
  return (
    <section id={block.id} className="scroll-mt-28 border-t border-ink-800 pt-8">
      <div className="flex items-baseline gap-3.5">
        <span
          aria-hidden="true"
          className="font-mono text-label text-mist-600 tabular-nums"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <h2 className="font-display text-xl leading-tight font-semibold text-mist-50 md:text-2xl">
          {block.title}
        </h2>
      </div>

      <div className="mt-5 md:pl-[2.1rem]">
        {block.paragraphs && block.paragraphs.length > 0 && (
          <div className="space-y-4">
            {block.paragraphs.map((paragraph, paragraphIndex) => (
              <p
                key={paragraphIndex}
                className="text-body leading-[1.8] text-mist-300"
              >
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {block.bullets && block.bullets.length > 0 && (
          <ul
            className={
              block.paragraphs?.length
                ? "mt-5 border-t border-ink-800"
                : "border-t border-ink-800"
            }
          >
            {block.bullets.map((bullet, bulletIndex) => (
              <li
                key={bulletIndex}
                className="flex gap-3 border-b border-ink-800 py-3.5"
              >
                <span
                  aria-hidden="true"
                  className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-azure-400/70"
                />
                <span className="text-body leading-[1.75] text-mist-300">
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) notFound();

  const repositoryLink = project.links?.find((link) => link.kind === "repository");
  const demoLink = project.links?.find((link) => link.kind === "demo");
  const otherLinks =
    project.links?.filter((link) => link !== repositoryLink && link !== demoLink) ?? [];

  /* Body sections, assembled in reading order and stripped of anything the
     project does not supply — so a lightly-documented project renders a short
     page rather than a page of empty headings. */
  const blocks: BodyBlock[] = [
    { id: "problem", title: "The problem", paragraphs: project.problem ? [project.problem] : undefined },
    { id: "features", title: "Key features", bullets: project.features },
    { id: "design", title: "Architecture & design decisions", paragraphs: project.architecture },
    { id: "implementation", title: "Implementation details", bullets: project.implementation },
    { id: "testing", title: "Testing", bullets: project.testing },
    ...(project.caseStudy ?? []).map((section) => ({
      id: section.id,
      title: section.heading,
      paragraphs: section.body,
      bullets: section.bullets,
    })),
    { id: "lessons", title: "What I took away", bullets: project.lessons },
  ].filter(
    (block) => (block.paragraphs?.length ?? 0) > 0 || (block.bullets?.length ?? 0) > 0,
  );

  /* Previous / next, over the same visible, ordered list the homepage shows —
     so neither hidden nor retired work can be reached by walking the pager. */
  const siblings = getProjects();
  const position = siblings.findIndex((entry) => entry.slug === project.slug);
  const previous = position > 0 ? siblings[position - 1] : undefined;
  const next =
    position >= 0 && position < siblings.length - 1 ? siblings[position + 1] : undefined;

  return (
    <article className="pt-32 pb-24">
      <div className="container-page">
        {/* ---------------- breadcrumb ---------------- */}
        <nav aria-label="Breadcrumb" className="mb-12">
          <ol className="flex items-center gap-2 font-mono text-label tracking-wide text-mist-500">
            <li>
              <Link
                href="/"
                className="rounded-control transition-colors hover:text-mist-200"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/#projects"
                className="rounded-control transition-colors hover:text-mist-200"
              >
                Projects
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="truncate text-mist-200">
              {project.name}
            </li>
          </ol>
        </nav>

        {/* ---------------- header ----------------
            A professional case study with an interactive architecture gets the
            dedicated hero: the TSP positioning and the confidentiality scope
            both need to land before the reader scrolls, not after. Everything
            else keeps the standard header. */}
        {project.interactiveArchitecture ? (
          <CaseStudyHero project={project} />
        ) : (
          <header>
            <div className="flex flex-wrap items-center gap-2.5">
              <KindBadge kind={project.kind} />
              <StatusBadge status={project.status} />
            </div>

            <p className="eyebrow mt-7 text-mist-600">{project.category}</p>

            <h1 className="mt-3 max-w-4xl text-[length:var(--text-display)] leading-[1.02] font-semibold text-balance">
              <span className="text-gradient">{project.name}</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-[1.6] font-light text-mist-200 text-pretty">
              {project.summary}
            </p>

            {/* --- links --- */}
            <div className="mt-9 flex flex-wrap gap-3">
              {repositoryLink?.url && (
                <ButtonLink href={repositoryLink.url} variant="primary" size="md">
                  <Icon name="GitHub" size={15} />
                  View repository
                </ButtonLink>
              )}
              {demoLink?.url && (
                <ButtonLink href={demoLink.url} variant="secondary" size="md">
                  <Icon name="ExternalLink" size={15} />
                  Live demo
                </ButtonLink>
              )}
              {otherLinks.map((link) =>
                link.url ? (
                  <ButtonLink key={link.label} href={link.url} variant="ghost" size="md">
                    <Icon name="Link2" size={15} />
                    {link.label}
                  </ButtonLink>
                ) : (
                  // A link with no URL is shown as unavailable rather than as a
                  // dead anchor — visible to the author, harmless to a visitor.
                  <span
                    key={link.label}
                    title="No URL configured for this link yet."
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-dashed border-ink-600 px-5 text-sm text-mist-600"
                  >
                    <Icon name="Link2" size={15} />
                    {link.label} — link not configured
                  </span>
                ),
              )}
            </div>
          </header>
        )}

        {/* ---------------- confidentiality ----------------
            The case-study hero carries its own scope notice, so this would be
            the same point made twice on that page. */}
        {project.confidentialityNote && !project.interactiveArchitecture && (
          <div className="mt-10 max-w-3xl">
            <ConfidentialityNotice note={project.confidentialityNote} />
          </div>
        )}

        {/* ---------------- metrics ----------------
            A hairline rail rather than four cards. Each figure carries the
            tool that produced it directly underneath, so no number on this
            page is ever shown without its provenance. */}
        {project.metrics && project.metrics.length > 0 && (
          <Reveal>
            {/* Columns follow the number of metrics. A fixed four-column
                track left a visibly empty cell on every project with three.
                The classes are written out in full rather than interpolated,
                because Tailwind scans source text and cannot see a class that
                only exists after a template literal is evaluated. */}
            <dl
              className={cn(
                "mt-14 grid divide-y divide-ink-800 border-y border-ink-800 lg:divide-x lg:divide-y-0",
                METRIC_COLUMNS[Math.min(project.metrics.length, 4)],
              )}
            >
              {project.metrics.map((metric) => (
                <div key={metric.label} className="px-0 py-6 lg:px-7 lg:first:pl-0">
                  <dt className="eyebrow-sm text-mist-600">{metric.label}</dt>
                  <dd className="mt-2.5 font-display text-2xl font-semibold text-mist-50">
                    {metric.value}
                  </dd>
                  {metric.source && (
                    <p className="mt-2 text-label leading-snug text-mist-600">
                      {metric.source}
                    </p>
                  )}
                </div>
              ))}
            </dl>
          </Reveal>
        )}

        {/* ---------------- architecture ---------------- */}
        {project.interactiveArchitecture ? (
          <section
            id="architecture"
            aria-labelledby="arch-heading"
            className="mt-16 scroll-mt-24"
          >
            <h2
              id="arch-heading"
              className="flex items-center gap-2.5 font-display text-xl font-semibold text-mist-50 md:text-2xl"
            >
              <Icon name="Network" size={18} className="text-azure-400" />
              Explore the architecture
            </h2>
            <p className="mt-3 mb-7 max-w-2xl text-body leading-relaxed text-mist-400">
              Select a component to read what it does, or play the walkthrough to
              follow a request from consent through to delivered records —
              including what happens when a provider fails.
            </p>
            <ArchitectureExplorer />
          </section>
        ) : (
          project.preview && (
            <Reveal>
              <figure className="mt-14 overflow-hidden rounded-panel border border-ink-600/70 bg-ink-900/60 shadow-[var(--shadow-card)]">
                <figcaption className="eyebrow border-b border-ink-700/70 px-5 py-3.5 text-mist-500">
                  {project.kind === "professional"
                    ? "High-level architecture · generic components, synthetic values"
                    : "Architecture"}
                </figcaption>
                <div className="bg-dots p-5 md:p-10">
                  <Image
                    src={project.preview}
                    alt={project.previewAlt ?? `${project.name} diagram`}
                    width={1200}
                    height={750}
                    className="h-auto w-full"
                    priority
                  />
                </div>
              </figure>
            </Reveal>
          )
        )}

        {/* ---------------- body ---------------- */}
        <div className="mt-20 grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
          <div className="min-w-0 space-y-14">
            {blocks.map((block, index) => (
              <Block key={block.id} block={block} index={index} />
            ))}
          </div>

          {/* ---------------- sidebar ----------------
              Hairline rails, matching the facts rail on the homepage. Boxing
              each group made the sidebar louder than the article beside it. */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border-l border-ink-700/70 pl-5">
              <h2 className="eyebrow text-mist-600">Stack</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {project.stack.map((technology) => (
                  <li key={technology}>
                    <Tag>{technology}</Tag>
                  </li>
                ))}
              </ul>
            </div>

            {blocks.length > 1 && (
              <nav
                aria-label="On this page"
                className="mt-9 border-l border-ink-700/70 pl-5"
              >
                <h2 className="eyebrow text-mist-600">On this page</h2>
                <ul className="mt-4 space-y-2.5">
                  {blocks.map((block, index) => (
                    <li key={block.id}>
                      <a
                        href={`#${block.id}`}
                        className="group flex items-baseline gap-2.5 rounded-control text-sm text-mist-400 transition-colors hover:text-azure-300"
                      >
                        <span
                          aria-hidden="true"
                          className="font-mono text-micro text-mist-600 tabular-nums transition-colors group-hover:text-azure-400"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {block.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <div className="mt-9">
              <ButtonLink href="/#projects" variant="secondary" size="md" className="w-full">
                <Icon name="ArrowRight" size={15} className="rotate-180" />
                All projects
              </ButtonLink>
            </div>
          </aside>
        </div>

        {/* ---------------- previous / next ---------------- */}
        {(previous || next) && (
          <nav
            aria-label="More projects"
            className="mt-24 grid gap-4 border-t border-ink-800 pt-10 sm:grid-cols-2"
          >
            {previous ? (
              <Link
                href={`/projects/${previous.slug}`}
                className="group flex flex-col gap-2 rounded-card border border-ink-700/60 p-5 transition-colors hover:border-ink-500 hover:bg-ink-900/50"
              >
                <span className="eyebrow-sm inline-flex items-center gap-1.5 text-mist-600">
                  <Icon
                    name="ArrowRight"
                    size={12}
                    className="rotate-180 transition-transform duration-300 motion-safe:group-hover:-translate-x-0.5"
                  />
                  Previous
                </span>
                <span className="font-display text-base font-semibold text-mist-100 transition-colors group-hover:text-white">
                  {previous.name}
                </span>
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}

            {next && (
              <Link
                href={`/projects/${next.slug}`}
                className="group flex flex-col gap-2 rounded-card border border-ink-700/60 p-5 transition-colors hover:border-ink-500 hover:bg-ink-900/50 sm:col-start-2 sm:items-end sm:text-right"
              >
                <span className="eyebrow-sm inline-flex items-center gap-1.5 text-mist-600">
                  Next
                  <Icon
                    name="ArrowRight"
                    size={12}
                    className="transition-transform duration-300 motion-safe:group-hover:translate-x-0.5"
                  />
                </span>
                <span className="font-display text-base font-semibold text-mist-100 transition-colors group-hover:text-white">
                  {next.name}
                </span>
              </Link>
            )}
          </nav>
        )}
      </div>
    </article>
  );
}
