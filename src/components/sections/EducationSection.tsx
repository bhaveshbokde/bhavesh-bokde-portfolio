import { getEducation } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";

/**
 * Education.
 *
 * Degree, institution, awarding university and years — and nothing else. No
 * grade, percentage, class or honour appears unless it is put into the
 * `details` array in `src/data/education.ts` explicitly.
 */
export function EducationSection() {
  const entries = getEducation();
  if (entries.length === 0) return null;

  return (
    <Section id="education" eyebrow="06 — Education" title="Education">
      <ul className="grid gap-5 md:grid-cols-2">
        {entries.map((entry, index) => (
          <li key={entry.id}>
            <Reveal delay={index * 0.06}>
              <article className="surface-card group h-full p-6 transition-colors duration-500 hover:border-ink-500 md:p-7">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-ink-600 bg-ink-850 text-iris-300">
                    <Icon name="GraduationCap" size={19} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-display text-base font-semibold text-mist-50">
                        {entry.degree}
                      </h3>
                      <span className="font-mono text-[11px] tracking-wide text-mist-500">
                        {entry.startYear} – {entry.endYear}
                      </span>
                    </div>

                    {entry.field && (
                      <p className="mt-1 text-sm text-azure-300">{entry.field}</p>
                    )}

                    <p className="mt-3 text-sm leading-relaxed text-mist-400">
                      {entry.institution}
                    </p>

                    {entry.affiliation && (
                      <p className="mt-1 text-xs text-mist-500">{entry.affiliation}</p>
                    )}

                    {entry.location && (
                      <p className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-[11px] text-mist-600">
                        <Icon name="MapPin" size={11} />
                        {entry.location}
                      </p>
                    )}

                    {entry.details && entry.details.length > 0 && (
                      <ul className="mt-4 space-y-1.5 border-t border-ink-700/60 pt-4">
                        {entry.details.map((detail, detailIndex) => (
                          <li
                            key={detailIndex}
                            className="text-xs leading-relaxed text-mist-500"
                          >
                            {detail}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
