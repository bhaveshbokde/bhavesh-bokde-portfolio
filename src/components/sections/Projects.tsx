import { getProjects } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { FeatureProject } from "@/components/ui/FeatureProject";
import { Icon } from "@/components/ui/Icon";

/**
 * The project showcase.
 *
 * Composed rather than gridded. The two projects carrying the most
 * engineering weight get full-width feature treatment with their architecture
 * diagram at a size you can actually read, alternating sides down the page;
 * the rest follow as compact cards. A uniform grid gives a 300-test
 * distributed-systems project exactly as much room as a weekend utility, and
 * flattens the judgement a portfolio exists to demonstrate.
 *
 * Which projects lead is a data decision, not a layout one: the first two in
 * `order` take the feature slots. Reorder them in `src/data/projects.ts` and
 * the composition follows.
 *
 * The professional case study is excluded — AAConnect has its own section
 * above with the interactive explorer, and showing it twice on one page with
 * two different treatments would read as a mistake.
 */
export function Projects() {
  const independent = getProjects().filter((p) => p.kind === "independent");
  if (independent.length === 0) return null;

  const featured = independent.slice(0, 2);
  const supporting = independent.slice(2);

  return (
    <Section
      id="projects"
      eyebrow="04 — Independent projects"
      title="Things I built to find out how they break"
      description={
        <>
          Personally owned repositories, each aimed at a problem a tutorial
          skips: the dual write, the oversold inventory, the retried payment,
          the result table that does not match its own query. Every figure is
          measured by the project&apos;s own tooling, and the status badge says
          plainly what is finished.
        </>
      }
    >
      {/* ───────────── featured ───────────── */}
      <div className="space-y-20 md:space-y-28">
        {featured.map((project, index) => (
          <Reveal key={project.slug} distance={24}>
            <FeatureProject project={project} index={index} />
          </Reveal>
        ))}
      </div>

      {/* ───────────── supporting ───────────── */}
      {supporting.length > 0 && (
        <>
          <Reveal>
            <div className="mt-24 mb-10 flex items-center gap-4 md:mt-32">
              <span className="eyebrow-sm whitespace-nowrap text-mist-600">
                Also built
              </span>
              <span aria-hidden="true" className="rule-fade w-full" />
            </div>
          </Reveal>

          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {supporting.map((project, index) => (
              <li key={project.slug} className="flex">
                <Reveal delay={Math.min(index, 3) * 0.07} className="flex w-full">
                  <ProjectCard project={project} />
                </Reveal>
              </li>
            ))}
          </ul>
        </>
      )}

      <Reveal delay={0.1}>
        <p className="mt-16 flex flex-wrap items-center justify-center gap-2 text-center text-xs text-mist-600">
          <Icon name="GitHub" size={14} className="text-mist-500" />
          More at{" "}
          <a
            href="https://github.com/bhaveshbokde"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-control text-azure-300 underline decoration-azure-500/40 underline-offset-4 transition-colors hover:text-azure-400"
          >
            github.com/bhaveshbokde
          </a>
        </p>
      </Reveal>
    </Section>
  );
}
