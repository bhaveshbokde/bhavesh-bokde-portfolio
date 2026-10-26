import Image from "next/image";
import { getCaseStudyProject } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Tag } from "@/components/ui/Tag";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { KindBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { ConfidentialityNotice } from "@/components/ui/ConfidentialityNotice";
import { ArchitectureExplorer } from "@/components/visuals/ArchitectureExplorer";

/**
 * The featured office project, given its own section on the home page.
 *
 * It renders whichever project is `kind: "professional"` and `featured: true`,
 * so promoting a different one is a data change. If no project matches, the
 * whole section disappears rather than rendering an empty shell.
 *
 * The confidentiality notice is not decoration. It is the first thing after
 * the summary, and it is what makes it legitimate to discuss employer work in
 * public at all: the page describes the engineering, names no internals, and
 * says so plainly.
 */
export function CaseStudySection() {
  const project = getCaseStudyProject();
  if (!project) return null;

  // Pull the two sections that work best as a teaser. Anything missing is
  // simply skipped.
  const context = project.caseStudy?.find((section) => section.id === "context");
  const role = project.caseStudy?.find((section) => section.id === "role");

  return (
    <Section
      id="case-study"
      eyebrow="03 — Featured case study"
      title={project.name}
      description={project.summary}
    >
      <div className="space-y-8">
        <Reveal>
          <div className="flex flex-wrap items-center gap-2.5">
            <KindBadge kind={project.kind} />
            <StatusBadge status={project.status} />
            <span className="font-mono text-label tracking-wide text-mist-500">
              {project.category}
            </span>
          </div>
        </Reveal>

        {project.confidentialityNote && (
          <Reveal delay={0.04}>
            <ConfidentialityNotice note={project.confidentialityNote} />
          </Reveal>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
          {/* ---------------- narrative ---------------- */}
          <Reveal delay={0.06}>
            <div className="space-y-7">
              {project.problem && (
                <div>
                  <h3 className="eyebrow text-azure-400">
                    The problem
                  </h3>
                  <p className="mt-3 text-body leading-[1.75] text-mist-300">
                    {project.problem}
                  </p>
                </div>
              )}

              {context?.body?.[1] && (
                <div>
                  <h3 className="eyebrow text-azure-400">
                    Why a gateway
                  </h3>
                  <p className="mt-3 text-body leading-[1.75] text-mist-300">
                    {context.body[1]}
                  </p>
                </div>
              )}

              {role && role.bullets && role.bullets.length > 0 && (
                <div>
                  <h3 className="eyebrow text-azure-400">
                    My contributions
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {role.bullets.slice(0, 4).map((bullet, index) => (
                      <li key={index} className="flex gap-3">
                        <Icon
                          name="Check"
                          size={14}
                          className="mt-1 shrink-0 text-jade-400"
                        />
                        <span className="text-sm leading-relaxed text-mist-400">
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {role.bullets.length > 4 && (
                    <p className="mt-3 pl-7 font-mono text-label text-mist-600">
                      + {role.bullets.length - 4} more in the full case study
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                <ButtonLink
                  href={`/projects/${project.slug}`}
                  variant="primary"
                  size="md"
                >
                  Read the full case study
                  <Icon
                    name="ArrowRight"
                    size={15}
                    className="transition-transform duration-300 motion-safe:group-hover:translate-x-0.5"
                  />
                </ButtonLink>
              </div>
            </div>
          </Reveal>

          {/* ---------------- diagram ---------------- */}
          {/* min-w-0: a grid item defaults to min-width:auto, so the
              diagram's min-width would force the whole track wide and the
              overflow-x-auto wrapper would never get to clip anything. */}
          <Reveal delay={0.1} className="min-w-0">
            {project.interactiveArchitecture ? (
              <ArchitectureExplorer />
            ) : (
            <figure className="surface-card overflow-hidden">
              <figcaption className="flex items-center justify-between gap-3 border-b border-ink-700/70 px-5 py-3">
                <span className="eyebrow text-mist-500">
                  High-level architecture
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded border border-ink-600 bg-ink-850 px-2 py-1 font-mono text-micro text-mist-500"
                  title="Generic component roles and synthetic values. No internal topology, service names or endpoints."
                >
                  <Icon name="Info" size={10} />
                  generic · synthetic
                </span>
              </figcaption>

              {project.preview && (
                <div className="bg-ink-950/50 p-4 md:p-6">
                  <Image
                    src={project.preview}
                    alt={project.previewAlt ?? `${project.name} architecture diagram`}
                    width={1000}
                    height={620}
                    className="h-auto w-full"
                    priority={false}
                  />
                </div>
              )}

              <div className="border-t border-ink-700/70 px-5 py-4">
                <ul className="flex flex-wrap gap-2">
                  {project.stack.slice(0, 10).map((technology) => (
                    <li key={technology}>
                      <Tag>{technology}</Tag>
                    </li>
                  ))}
                  {project.stack.length > 10 && (
                    <li>
                      <Tag variant="muted">+{project.stack.length - 10}</Tag>
                    </li>
                  )}
                </ul>
              </div>
            </figure>
            )}
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
