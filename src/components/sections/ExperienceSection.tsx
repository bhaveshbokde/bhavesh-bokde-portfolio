import { getExperience, formatDateRange, formatDuration } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Tag } from "@/components/ui/Tag";
import { Icon } from "@/components/ui/Icon";

/**
 * The professional timeline.
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
      <ol className="relative">
        {/* The spine. Fades at both ends so it reads as a thread rather than
            a border. */}
        <div
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-[11px] w-px bg-gradient-to-b from-transparent via-ink-600 to-transparent md:left-[15px]"
        />

        {roles.map((role, index) => (
          <li key={role.id} className="relative pb-12 pl-10 last:pb-0 md:pl-14">
            {/* Node */}
            <span
              aria-hidden="true"
              className="absolute top-1.5 left-0 grid h-6 w-6 place-items-center rounded-full border border-ink-600 bg-ink-900 md:h-8 md:w-8"
            >
              <span className="h-2 w-2 rounded-full bg-gradient-to-br from-azure-400 to-iris-500 md:h-2.5 md:w-2.5" />
              {!role.endDate && (
                <span
                  data-motion="decorative"
                  className="absolute inset-0 animate-ping rounded-full border border-azure-500/40"
                />
              )}
            </span>

            <Reveal delay={index * 0.05}>
              <article className="surface-card p-6 md:p-8">
                {/* --- header --- */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-mist-50 md:text-xl">
                      {role.role}
                    </h3>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-mist-400">
                      {role.companyUrl ? (
                        <a
                          href={role.companyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-medium text-azure-300 transition-colors hover:text-azure-400"
                        >
                          {role.company}
                          <Icon name="ArrowUpRight" size={13} />
                        </a>
                      ) : (
                        <span className="font-medium text-mist-200">{role.company}</span>
                      )}
                      {role.location && (
                        <>
                          <span aria-hidden="true" className="text-mist-600">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Icon name="MapPin" size={12} className="text-mist-500" />
                            {role.location}
                          </span>
                        </>
                      )}
                      {role.employmentType && (
                        <>
                          <span aria-hidden="true" className="text-mist-600">·</span>
                          <span>{role.employmentType}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0 sm:text-right">
                    <p className="font-mono text-xs tracking-wide text-mist-300">
                      {formatDateRange(role.startDate, role.endDate)}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-mist-500">
                      {formatDuration(role.startDate, role.endDate)}
                    </p>
                  </div>
                </div>

                {role.summary && (
                  <p className="mt-5 border-l-2 border-azure-500/30 pl-4 text-[15px] leading-relaxed text-mist-300">
                    {role.summary}
                  </p>
                )}

                {/* --- highlights --- */}
                <ul className="mt-6 space-y-3">
                  {role.highlights.map((highlight, highlightIndex) => (
                    <li key={highlightIndex} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-azure-400/70"
                      />
                      <p className="text-[15px] leading-relaxed text-mist-400">
                        {highlight.text}
                        {highlight.resumeReported && (
                          <span
                            className="ml-2 inline-flex items-center gap-1 rounded border border-ink-600 bg-ink-850 px-1.5 py-0.5 align-middle font-mono text-[10px] text-mist-500"
                            title="This figure is reported in my resume. It is not a measurement independently re-run for this website."
                          >
                            <Icon name="Info" size={10} />
                            resume-reported
                          </span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>

                {/* --- stack --- */}
                {role.stack && role.stack.length > 0 && (
                  <div className="mt-7 border-t border-ink-700/70 pt-5">
                    <ul className="flex flex-wrap gap-2">
                      {role.stack.map((technology) => (
                        <li key={technology}>
                          <Tag>{technology}</Tag>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}
