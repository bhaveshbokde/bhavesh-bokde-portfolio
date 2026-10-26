import { profile } from "@/data/profile";
import { siteConfig } from "@/data/site-config";
import { getHeroLinks, getSummary } from "@/lib/content";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { HeroVisual } from "@/components/visuals/HeroVisual";
import { ParticleField } from "@/components/visuals/ParticleField";
import { TechMarquee } from "@/components/ui/TechMarquee";
import { Choreo, ChoreoItem } from "@/components/ui/Choreography";

/**
 * The hero.
 *
 * Composition notes, since this is the part of the page doing the most work:
 *
 * The layout sits on a 12-column grid, split 7/5 between copy and visual
 * rather than centred or evenly halved. An even split reads as a template; the
 * uneven one gives the headline somewhere to sit and the visual room to
 * breathe without competing with it.
 *
 * The type steps hard between few levels — mono eyebrow, name at display
 * scale, role a clear step below, then body. Large jumps across a small number
 * of levels is what makes a hierarchy look art-directed rather than merely
 * sized.
 *
 * Everything above the fold is server-rendered, so the first paint contains
 * real text and the derived years-of-experience figure cannot drift between
 * server and client. Only the entrance choreography and the visual are client
 * components.
 *
 * Nothing here is a fabricated statistic: no project counts, no client logos,
 * no uptime figures, no testimonials. There is no honest version of those for
 * an engineer four years in, and a recruiter who checked would find out.
 */
export function Hero() {
  const summary = getSummary();
  const heroLinks = getHeroLinks();

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative flex min-h-[94vh] items-center overflow-hidden pt-28 pb-20 md:min-h-screen md:pt-32"
    >
      <ParticleField className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* One wash anchoring the composition to the upper left, so the headline
          sits in light and the page darkens as it descends. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 12% 18%, rgb(59 125 245 / 0.13), transparent 70%)," +
            "radial-gradient(45% 45% at 82% 32%, rgb(139 92 246 / 0.10), transparent 72%)",
        }}
      />

      <div className="container-page relative w-full">
        <div className="grid items-center gap-x-10 gap-y-14 lg:grid-cols-12">
          {/* ───────────── copy: 7 of 12 ───────────── */}
          <Choreo className="lg:col-span-7">
            <ChoreoItem>
              <p className="inline-flex items-center gap-2.5 rounded-full border border-ink-600/80 bg-ink-850/60 px-3.5 py-1.5 font-mono text-label text-mist-400 backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    data-motion="decorative"
                    className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jade-400 opacity-70"
                  />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-jade-400" />
                </span>
                Senior Associate Software Engineer · Lentra AI
              </p>
            </ChoreoItem>

            {/* Name and role live in the same h1. Splitting the role into a
                sibling paragraph looked identical but left the page's only
                heading reading "Bhavesh Bokde" with no indication of what he
                does — which is exactly the context a screen-reader user
                skimming by heading, and a search result, both depend on. The
                hairline sits inside it, aria-hidden. */}
            <ChoreoItem as="h1" distance={18}>
              <span id="hero-heading" className="mt-7 block">
                <span className="block text-[length:var(--text-display-lg)] leading-[0.92] font-semibold text-mist-50">
                  {profile.name}
                </span>
                <span className="mt-5 flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="h-px w-12 shrink-0 bg-gradient-to-r from-azure-400 to-transparent"
                  />
                  <span className="text-gradient text-[length:var(--text-display)] leading-[1.05] font-semibold">
                    {profile.title}
                  </span>
                </span>
              </span>
            </ChoreoItem>

            <ChoreoItem
              as="p"
              className="mt-7 max-w-[58ch] text-base leading-[1.7] text-mist-400 md:text-lead"
            >
              {summary}
            </ChoreoItem>

            <ChoreoItem>
              <TechMarquee items={profile.heroTechnologies ?? []} />
            </ChoreoItem>

            {/* ───────────── actions ───────────── */}
            <ChoreoItem>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <ButtonLink href="#projects" variant="primary" size="lg">
                  View projects
                  <Icon
                    name="ArrowRight"
                    size={16}
                    className="transition-transform duration-300 motion-safe:group-hover:translate-x-0.5"
                  />
                </ButtonLink>

                <ButtonLink href="#experience" variant="secondary" size="lg">
                  <Icon name="Building2" size={15} />
                  Experience
                </ButtonLink>

                <ButtonLink
                  href={siteConfig.resumePath}
                  download={siteConfig.resumeDownloadName}
                  variant="ghost"
                  size="lg"
                >
                  <Icon
                    name="Download"
                    size={16}
                    className="transition-transform duration-300 motion-safe:group-hover:translate-y-0.5"
                  />
                  Résumé
                </ButtonLink>
              </div>
            </ChoreoItem>

            {/* ───────────── elsewhere ───────────── */}
            <ChoreoItem>
              <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
                <span
                  aria-hidden="true"
                  className="h-px w-10 bg-gradient-to-r from-ink-500 to-transparent"
                />
                <ul className="flex items-center gap-2">
                  {heroLinks.map((link) =>
                    link.url ? (
                      <li key={link.id}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${link.label}${link.handle ? ` — ${link.handle}` : ""} (opens in a new tab)`}
                          className="group grid h-10 w-10 place-items-center rounded-control border border-ink-600/80 bg-ink-850/50 text-mist-400 transition-all duration-300 hover:border-azure-500/50 hover:text-white active:scale-95 motion-safe:hover:-translate-y-0.5"
                        >
                          <Icon name={link.icon} size={17} />
                        </a>
                      </li>
                    ) : null,
                  )}
                </ul>
                <span className="font-mono text-micro text-mist-600">
                  {profile.location}
                </span>
              </div>
            </ChoreoItem>
          </Choreo>

          {/* ───────────── visual: 5 of 12 ───────────── */}
          <Choreo className="lg:col-span-5" delay={0.25}>
            <ChoreoItem distance={22}>
              <HeroVisual />
            </ChoreoItem>
          </Choreo>
        </div>
      </div>

      {/* ───────────── scroll cue ─────────────
          A real link, not a decorative arrow: it goes where it points, works
          from the keyboard, and announces itself. */}
      <div className="absolute inset-x-0 bottom-7 hidden justify-center md:flex">
        <a
          href="#about"
          aria-label="Scroll to the About section"
          className="group flex flex-col items-center gap-2 rounded-control px-3 py-2 text-mist-600 transition-colors hover:text-mist-300"
        >
          <span className="eyebrow-sm">Scroll</span>
          <span aria-hidden="true" className="relative h-9 w-px overflow-hidden bg-ink-600">
            <span
              data-motion="decorative"
              className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-azure-400 to-transparent"
              style={{ animation: "scroll-cue 2.4s ease-in-out infinite" }}
            />
          </span>
        </a>
      </div>
    </section>
  );
}
