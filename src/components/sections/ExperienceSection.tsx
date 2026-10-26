import { getExperience, formatDateRange, formatDuration } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Tag } from "@/components/ui/Tag";
import { Icon } from "@/components/ui/Icon";

/**
 * The professional timeline.
 *
 * Set as an editorial entry rather than a card on a spine. A card draws a box
 * around a role and makes every role look like a component in a grid; what a
 * reader actually wants is the shape of the work, which is a heading, a
 * sentence and a short list of things that were built. So the box is gone and
 * the page itself is the surface: dates live on their own rail at the left,
 * the spine runs between the two columns, and the content is plain prose at a
 * size you can read.
 *
 * Highlights are numbered and separated by hairlines rather than bulleted.
 * These are distinct pieces of work, not a shopping list, and numbering them
 * makes each one a thing you can refer to in a conversation.
 *
 * Dates and durations are formatted from the ISO values in
 * `src/data/experience.ts` — "Sep 2022 – Present" and "4 yrs 2 mos" are both
 * computed, so neither can go stale. A role with no `endDate` is current, and
 * its duration keeps counting on its own.
 *
 * A highlight flagged `resumeReported` renders with an explicit marker. That
 * matters for the ~30% diagnosis-time figure: it is a real reported outcome of
 * the work, but it is not a benchmark anyone re-ran for this website, and the
 * page should not let someone mistake one for the other.
 */
export function ExperienceSection() {
  const roles = getExperience();
  if (roles.length === 0) return null;

  return (
    <Section
      id="experience"
      eyebrow="02 — Experience"
      title="Professional experience"
      description="Production backend work in India's Account Aggregator ecosystem — consent flows, provider integrations, and the reliability engineering around them."
    >
      <ol className="space-y-16 md:space-y-24">
        {roles.map((role, index) => {
          const current = !role.endDate;

          return (
            <li key={role.id}>
              <Reveal delay={index * 0.05}>
                <article className="grid gap-5 md:grid-cols-[9.5rem_minmax(0,1fr)] md:gap-10">
                  {/* ───────── date rail ───────── */}
                  <div className="md:pt-1.5 md:text-right">
                    <p className="font-mono text-caption tracking-wide text-mist-200">
                      {formatDateRange(role.startDate, role.endDate)}
                    </p>
                    <p className="mt-1.5 font-mono text-label text-mist-600">
                      {formatDuration(role.startDate, role.endDate)}
                    </p>
                    {current && (
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-jade-400/30 bg-jade-400/10 px-2.5 py-1 font-mono text-micro tracking-label text-jade-400 uppercase">
                        <span
                          aria-hidden="true"
                          className="relative flex h-1.5 w-1.5"
                        >
                          <span
                            data-motion="decorative"
                            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jade-400/70"
                          />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-jade-400" />
                        </span>
                        Current
                      </p>
                    )}
                  </div>

                  {/* ───────── content ───────── */}
                  <div className="relative min-w-0 border-l border-ink-700/70 pl-6 md:pl-10">
                    {/* The node sits on the spine, aligned to the role title. */}
                    <span
                      aria-hidden="true"
                      className="absolute top-2 -left-[4.5px] h-2.5 w-2.5 rounded-full bg-gradient-to-br from-azure-400 to-iris-500 ring-4 ring-ink-950"
                    />

                    <h3 className="font-display text-2xl leading-tight font-semibold text-mist-50 md:text-[1.75rem]">
                      {role.role}
                    </h3>

                    <p className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-mist-400">
                      {role.companyUrl ? (
                        <a
                          href={role.companyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1.5 rounded-control font-medium text-azure-300 transition-colors hover:text-azure-400"
                        >
                          <span className="bg-gradient-to-r from-current to-current bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
                            {role.company}
                          </span>
                          <Icon
                            name="ArrowUpRight"
                            size={13}
                            className="transition-transform duration-300 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                          />
                        </a>
                      ) : (
                        <span className="font-medium text-mist-200">
                          {role.company}
                        </span>
                      )}
                      {role.location && (
                        <>
                          <span aria-hidden="true" className="text-mist-600">
                            ·
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Icon
                              name="MapPin"
                              size={12}
                              className="text-mist-500"
                            />
                            {role.location}
                          </span>
                        </>
                      )}
                      {role.employmentType && (
                        <>
                          <span aria-hidden="true" className="text-mist-600">
                            ·
                          </span>
                          <span>{role.employmentType}</span>
                        </>
                      )}
                    </p>

                    {role.summary && (
                      <p className="mt-6 text-lg leading-[1.6] font-light text-mist-200 text-pretty">
                        {role.summary}
                      </p>
                    )}

                    {/* ───────── highlights ───────── */}
                    <ol className="mt-8 border-t border-ink-800">
                      {role.highlights.map((highlight, highlightIndex) => (
                        <li
                          key={highlightIndex}
                          className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 border-b border-ink-800 py-4"
                        >
                          <span
                            aria-hidden="true"
                            className="pt-0.5 font-mono text-label text-mist-600 tabular-nums"
                          >
                            {String(highlightIndex + 1).padStart(2, "0")}
                          </span>
                          <p className="text-body leading-[1.75] text-mist-300">
                            {highlight.text}
                            {highlight.resumeReported && (
                              <span
                                className="ml-2 inline-flex items-center gap-1 rounded border border-ink-600 bg-ink-850 px-1.5 py-0.5 align-middle font-mono text-micro text-mist-500"
                                title="This figure is reported in my resume. It is not a measurement independently re-run for this website."
                              >
                                <Icon name="Info" size={10} />
                                resume-reported
                              </span>
                            )}
                          </p>
                        </li>
                      ))}
                    </ol>

                    {/* ───────── stack ───────── */}
                    {role.stack && role.stack.length > 0 && (
                      <div className="mt-7">
                        <h4 className="eyebrow-sm mb-3 text-mist-600">
                          Worked with
                        </h4>
                        <ul className="flex flex-wrap gap-2">
                          {role.stack.map((technology) => (
                            <li key={technology}>
                              <Tag>{technology}</Tag>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </article>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
