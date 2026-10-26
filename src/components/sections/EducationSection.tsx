import { getEducation } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";

/**
 * Education.
 *
 * Deliberately set on the same rail as the experience timeline — years on the
 * left, the entry on the right, hairlines between — so the two read as one
 * continuous record of where the time went rather than as two unrelated
 * widgets stacked on a page. With a single degree to show, a two-column card
 * grid left a conspicuous empty cell; a full-width row simply ends where the
 * content ends.
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
      <ol className="border-t border-ink-800">
        {entries.map((entry, index) => (
          <li key={entry.id} className="border-b border-ink-800">
            <Reveal delay={index * 0.06}>
              <article className="group grid gap-4 py-8 md:grid-cols-[9.5rem_minmax(0,1fr)] md:gap-10 md:py-10">
                {/* ───────── year rail ─────────
                    Icon and years stay on one line. Stacked, the icon read as
                    a stray badge floating in the margin with nothing to do. */}
                <div className="flex items-center gap-2.5 md:justify-end md:pt-0.5">
                  <span
                    aria-hidden="true"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-ink-700 bg-ink-850 text-iris-300 transition-colors duration-500 group-hover:border-iris-400/40"
                  >
                    <Icon name="GraduationCap" size={14} />
                  </span>
                  <p className="font-mono text-caption tracking-wide text-mist-200">
                    {entry.startYear} – {entry.endYear}
                  </p>
                </div>

                {/* ───────── entry ───────── */}
                <div className="min-w-0 border-l border-ink-700/70 pl-6 md:pl-10">
                  <h3 className="font-display text-xl leading-tight font-semibold text-mist-50 md:text-2xl">
                    {entry.degree}
                  </h3>

                  {entry.field && (
                    <p className="mt-1.5 text-azure-300">{entry.field}</p>
                  )}

                  <p className="mt-5 text-body leading-relaxed text-mist-300">
                    {entry.institution}
                  </p>

                  {entry.affiliation && (
                    <p className="mt-1.5 text-caption text-mist-500">
                      {entry.affiliation}
                    </p>
                  )}

                  {entry.location && (
                    <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-label text-mist-600">
                      <Icon name="MapPin" size={11} />
                      {entry.location}
                    </p>
                  )}

                  {entry.details && entry.details.length > 0 && (
                    <ul className="mt-5 space-y-2 border-t border-ink-800 pt-5">
                      {entry.details.map((detail, detailIndex) => (
                        <li
                          key={detailIndex}
                          className="text-caption leading-relaxed text-mist-500"
                        >
                          {detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}
