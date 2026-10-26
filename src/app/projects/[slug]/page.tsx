import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { projects } from "@/data/projects";
import { siteConfig } from "@/data/site-config";
import { getProjectBySlug } from "@/lib/content";
import { Tag } from "@/components/ui/Tag";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { KindBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { ConfidentialityNotice } from "@/components/ui/ConfidentialityNotice";
import { ArchitectureExplorer } from "@/components/visuals/ArchitectureExplorer";

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

/** A heading + body block, skipped entirely when there is nothing to show. */
function Block({
  title,
  paragraphs,
  bullets,
  icon,
}: {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  icon?: string;
}) {
  if (!paragraphs?.length && !bullets?.length) return null;

  return (
    <section className="scroll-mt-28">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-mist-50">
        {icon && <Icon name={icon} size={17} className="text-azure-400" />}
        {title}
      </h2>

      {paragraphs && paragraphs.length > 0 && (
        <div className="mt-4 space-y-4">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-[15px] leading-[1.75] text-mist-300">
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {bullets && bullets.length > 0 && (
        <ul className="mt-4 space-y-3">
          {bullets.map((bullet, index) => (
            <li key={index} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-azure-400/70"
              />
              <span className="text-[15px] leading-[1.75] text-mist-300">{bullet}</span>
            </li>
          ))}
        </ul>
      )}
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

  return (
    <article className="pt-32 pb-24">
      <div className="container-page">
        {/* ---------------- breadcrumb ---------------- */}
        <nav aria-label="Breadcrumb" className="mb-10">
          <ol className="flex items-center gap-2 font-mono text-[11px] tracking-wide text-mist-500">
            <li>
              <Link href="/" className="transition-colors hover:text-mist-200">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/#projects" className="transition-colors hover:text-mist-200">
                Projects
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-mist-200">
              {project.name}
            </li>
          </ol>
        </nav>

        {/* ---------------- header ---------------- */}
        <header className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <KindBadge kind={project.kind} />
            <StatusBadge status={project.status} />
          </div>

          <h1 className="mt-5 text-[length:var(--text-display)] leading-[1.02] font-semibold">
            <span className="text-gradient">{project.name}</span>
          </h1>

          <p className="mt-3 font-mono text-xs tracking-[0.16em] text-mist-500 uppercase">
            {project.category}
          </p>

          <p className="mt-6 text-lg leading-relaxed text-mist-300">{project.summary}</p>

          {/* --- links --- */}
          <div className="mt-8 flex flex-wrap gap-3">
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

        {/* ---------------- confidentiality ---------------- */}
        {project.confidentialityNote && (
          <div className="mt-10 max-w-3xl">
            <ConfidentialityNotice note={project.confidentialityNote} />
          </div>
        )}

        {/* ---------------- architecture ---------------- */}
        {project.interactiveArchitecture ? (
          <section aria-labelledby="arch-heading" className="mt-12">
            <h2
              id="arch-heading"
              className="flex items-center gap-2.5 font-display text-xl font-semibold text-mist-50"
            >
              <Icon name="Network" size={17} className="text-azure-400" />
              Explore the architecture
            </h2>
            <p className="mt-3 mb-6 max-w-2xl text-[15px] leading-relaxed text-mist-400">
              Select a component to read what it does, or play the walkthrough to
              follow a request from consent through to delivered records —
              including what happens when a provider fails.
            </p>
            <ArchitectureExplorer />
          </section>
        ) : (
          project.preview && (
          <Reveal>
            <figure className="surface-card mt-12 overflow-hidden">
              <figcaption className="border-b border-ink-700/70 px-5 py-3 font-mono text-[11px] tracking-[0.16em] text-mist-500 uppercase">
                {project.kind === "professional"
                  ? "High-level architecture · generic components, synthetic values"
                  : "Architecture"}
              </figcaption>
              <div className="bg-ink-950/50 p-5 md:p-8">
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

        {/* ---------------- metrics ---------------- */}
        {project.metrics && project.metrics.length > 0 && (
          <Reveal>
            <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {project.metrics.map((metric) => (
                <div key={metric.label} className="surface-card p-5">
                  <dt className="font-mono text-[10px] tracking-[0.18em] text-mist-600 uppercase">
                    {metric.label}
                  </dt>
                  <dd className="mt-2 font-display text-xl font-semibold text-mist-50">
                    {metric.value}
                  </dd>
                  {metric.source && (
                    <p className="mt-1.5 text-[11px] leading-snug text-mist-600">
                      {metric.source}
                    </p>
                  )}
                </div>
              ))}
            </dl>
          </Reveal>
        )}

        {/* ---------------- body ---------------- */}
        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
          <div className="min-w-0 space-y-14">
            <Block title="The problem" icon="Info" paragraphs={project.problem ? [project.problem] : undefined} />
            <Block title="Key features" icon="Sparkles" bullets={project.features} />
            <Block title="Architecture & design decisions" icon="Network" paragraphs={project.architecture} />
            <Block title="Implementation details" icon="Braces" bullets={project.implementation} />
            <Block title="Testing" icon="FlaskConical" bullets={project.testing} />

            {/* Long-form case study sections, rendered in data order. */}
            {project.caseStudy?.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-28">
                <Block
                  title={section.heading}
                  paragraphs={section.body}
                  bullets={section.bullets}
                  icon="Layers"
                />
              </div>
            ))}

            <Block title="What I took away" icon="Gauge" bullets={project.lessons} />
          </div>

          {/* ---------------- sidebar ---------------- */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="surface-card p-5">
              <h2 className="font-mono text-[11px] tracking-[0.2em] text-mist-500 uppercase">
                Stack
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {project.stack.map((technology) => (
                  <li key={technology}>
                    <Tag>{technology}</Tag>
                  </li>
                ))}
              </ul>
            </div>

            {project.caseStudy && project.caseStudy.length > 0 && (
              <nav aria-label="On this page" className="surface-card mt-4 p-5">
                <h2 className="font-mono text-[11px] tracking-[0.2em] text-mist-500 uppercase">
                  On this page
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {project.caseStudy.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="text-sm text-mist-400 transition-colors hover:text-azure-300"
                      >
                        {section.heading}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <div className="mt-4">
              <ButtonLink href="/#projects" variant="secondary" size="md" className="w-full">
                <Icon name="ArrowRight" size={15} className="rotate-180" />
                All projects
              </ButtonLink>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
