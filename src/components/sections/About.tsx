import { profile } from "@/data/profile";
import { visibleSorted } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Disclosure } from "@/components/ui/Disclosure";

/**
 * About.
 *
 * Composed as an editorial opening rather than a text block beside a card.
 *
 * The first paragraph is set noticeably larger than the rest — a drop-lead.
 * It is the one piece of prose a skimming reader is actually going to read,
 * so it gets the weight, and everything after it steps down to body size. A
 * uniform wall of four equally-sized paragraphs gives the eye nowhere to land
 * and quietly asks the reader to do the prioritising themselves.
 *
 * The facts are a hairline rail, not a surface card. They are metadata about a
 * person, not a component of the system; boxing them made them compete with
 * the narrative for attention when their job is to sit quietly beside it. On
 * desktop the rail is sticky, so the facts stay in view while the longer
 * story scrolls past them.
 *
 * `aboutExpanded` and `facts` are both optional in the data — leave either out
 * and this renders correctly without them.
 */
export function About() {
  const facts = visibleSorted(profile.facts ?? []);
  const [lead, ...rest] = profile.about;
  const hasExpanded = (profile.aboutExpanded?.length ?? 0) > 0;

  return (
    <Section
      id="about"
      eyebrow="01 — About"
      title="Backend engineering, at the edges where systems meet"
      divider={false}
    >
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        {/* ───────────── narrative ───────────── */}
        <div className="min-w-0 lg:col-span-7">
          <Reveal>
            {lead && (
              <p className="text-lg leading-[1.6] font-light text-mist-100 text-pretty md:text-xl md:leading-[1.58]">
                {lead}
              </p>
            )}
          </Reveal>

          {rest.length > 0 && (
            <Reveal delay={0.06}>
              <div className="mt-7 space-y-5 text-body leading-[1.8] text-mist-400">
                {rest.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </Reveal>
          )}

          {hasExpanded && (
            <Reveal delay={0.1}>
              <div className="mt-7 border-t border-ink-800 pt-6">
                <Disclosure showLabel="Read more" hideLabel="Show less">
                  <div className="space-y-5 text-body leading-[1.8] text-mist-400">
                    {profile.aboutExpanded?.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </Disclosure>
              </div>
            </Reveal>
          )}
        </div>

        {/* ───────────── facts rail ───────────── */}
        {facts.length > 0 && (
          <div className="min-w-0 lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.08}>
              <div className="lg:sticky lg:top-28">
                <dl className="relative border-l border-ink-700/70 pl-6">
                  {/* The rail lights at the top and fades out, so it reads as a
                      thread rather than a border. */}
                  <span
                    aria-hidden="true"
                    className="absolute top-0 -left-px h-20 w-px bg-gradient-to-b from-azure-400/80 to-transparent"
                  />

                  {facts.map((fact) => (
                    <div
                      key={fact.label}
                      className="border-b border-ink-800 py-5 first:pt-0 last:border-b-0 last:pb-0"
                    >
                      <dt className="eyebrow-sm text-mist-600">{fact.label}</dt>
                      <dd className="mt-2">
                        <span className="font-display text-base font-medium text-mist-100">
                          {fact.value}
                        </span>
                        {fact.note && (
                          <span className="mt-1 block text-caption text-mist-500">
                            {fact.note}
                          </span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* A short, honest framing of what is professional work and
                    what is personal. It appears once, here, and the badges on
                    each project carry it from then on. */}
                <p className="mt-8 border-l-2 border-ink-700 pl-5 text-caption leading-relaxed text-mist-500">
                  Work on this site is labelled either{" "}
                  <span className="text-iris-300">Professional</span> — built for
                  an employer and described rather than published — or{" "}
                  <span className="text-mist-200">Independent</span>, which means
                  a public repository you can clone and read.
                </p>
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </Section>
  );
}
