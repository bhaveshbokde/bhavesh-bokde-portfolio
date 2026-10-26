import { getProjects } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { Icon } from "@/components/ui/Icon";

/**
 * The project gallery.
 *
 * The professional project already has its own case-study section above, so it
 * is excluded here and this grid is independent work only — otherwise AAConnect
 * would appear twice on one page with two different treatments.
 *
 * The grid is rendered from `getProjects()`, so adding a project to
 * `src/data/projects.ts` makes a card appear. There is no list of cards in this
 * file to keep in sync.
 */
export function Projects() {
  const independent = getProjects().filter((project) => project.kind === "independent");
  if (independent.length === 0) return null;

  return (
    <Section
      id="projects"
      eyebrow="04 — Independent projects"
      title="Things I built to find out how they break"
      description={
        <>
          Personally owned repositories, each one aimed at a problem that a
          tutorial skips: the dual write, the oversold inventory, the retried
          payment. Every figure quoted is measured by the project&apos;s own
          tooling, and the status badge says plainly what is finished and what
          is not.
        </>
      }
    >
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {independent.map((project, index) => (
          <li key={project.slug} className="flex">
            <Reveal delay={Math.min(index, 4) * 0.06} className="flex w-full">
              <ProjectCard project={project} />
            </Reveal>
          </li>
        ))}
      </ul>

      <Reveal delay={0.1}>
        <p className="mt-10 flex flex-wrap items-center justify-center gap-2 text-center text-xs text-mist-600">
          <Icon name="GitHub" size={14} className="text-mist-500" />
          More at{" "}
          <a
            href="https://github.com/bhaveshbokde"
            target="_blank"
            rel="noopener noreferrer"
            className="text-azure-300 underline decoration-azure-500/40 underline-offset-4 transition-colors hover:text-azure-400"
          >
            github.com/bhaveshbokde
          </a>
        </p>
      </Reveal>
    </Section>
  );
}
