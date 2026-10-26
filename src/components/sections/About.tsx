import { profile } from "@/data/profile";
import { visibleSorted } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Disclosure } from "@/components/ui/Disclosure";
import { Icon } from "@/components/ui/Icon";

/**
 * About.
 *
 * Structured for a recruiter who is skimming: two paragraphs that stand on
 * their own, a strip of hard facts, and the longer story behind a "Read more"
 * control for anyone who actually wants it. Nobody is forced to read four
 * paragraphs to find out where I live.
 *
 * `aboutExpanded` and `facts` are both optional in the data — leave either out
 * and this renders correctly without them.
 */
export function About() {
  const facts = visibleSorted(profile.facts ?? []);
  const hasExpanded = (profile.aboutExpanded?.length ?? 0) > 0;

  return (
    <Section
      id="about"
      eyebrow="01 — About"
      title="Backend engineering, at the edges where systems meet"
      divider={false}
    >
      <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
        {/* ---------------- narrative ---------------- */}
        <Reveal>
          <div className="space-y-5 text-body leading-[1.75] text-mist-300 md:text-base">
            {profile.about.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}

            {hasExpanded && (
              <Disclosure showLabel="Read more" hideLabel="Show less">
                {profile.aboutExpanded?.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </Disclosure>
            )}
          </div>
        </Reveal>

        {/* ---------------- facts ---------------- */}
        {facts.length > 0 && (
          <Reveal delay={0.08}>
            <dl className="surface-card divide-y divide-ink-700/60 overflow-hidden">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                >
                  <dt className="eyebrow text-mist-500">
                    {fact.label}
                  </dt>
                  <dd className="text-right">
                    <span className="text-sm font-medium text-mist-100">
                      {fact.value}
                    </span>
                    {fact.note && (
                      <span className="mt-0.5 block text-xs text-mist-500">
                        {fact.note}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {/* A short, honest framing of what is professional work and what
                is personal. It appears once, here, and the badges on each
                project carry it from then on. */}
            <div className="surface-inset mt-5 flex gap-3 px-5 py-4">
              <Icon
                name="Info"
                size={16}
                className="mt-0.5 shrink-0 text-azure-400"
              />
              <p className="text-xs leading-relaxed text-mist-400">
                Work on this site is labelled either{" "}
                <span className="text-iris-300">Professional</span> — built for an
                employer and described rather than published — or{" "}
                <span className="text-mist-200">Independent</span>, which means a
                public repository you can clone and read.
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </Section>
  );
}
