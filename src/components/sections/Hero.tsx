import { profile } from "@/data/profile";
import { siteConfig } from "@/data/site-config";
import { getHeroLinks, getSummary } from "@/lib/content";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { HeroVisual } from "@/components/visuals/HeroVisual";
import { ParticleField } from "@/components/visuals/ParticleField";
import { TechMarquee } from "@/components/ui/TechMarquee";

/**
 * The hero.
 *
 * A server component on purpose. The headline, the summary and the derived
 * years-of-experience figure are all rendered on the server and arrive in the
 * HTML, so the first paint has real text in it rather than a skeleton — and
 * the derived year count cannot drift between server and client.
 *
 * Only the diagram is a client component, and it is below the fold on a phone.
 *
 * Nothing here is a fabricated statistic. There are no "50+ projects", no
 * client logos and no testimonials, because there is no honest version of
 * those for an engineer four years into a career.
 */
export function Hero() {
  const summary = getSummary();
  const heroLinks = getHeroLinks();

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative flex min-h-[92vh] items-center overflow-hidden pt-28 pb-16 md:min-h-screen md:pt-32"
    >
      {/* The particle network sits behind the hero only, and stops its loop
          the moment this section scrolls out of view.

          Deliberately NOT marked `data-motion="decorative"`: under reduced
          motion it paints a single static frame, and the network is worth
          keeping as texture. It is the movement that gets dropped, not the
          picture. */}
      <ParticleField className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="container-page relative w-full">
        {/* The copy column is given the extra width so "Java Backend Engineer"
            sits on one line at desktop. Wrapped, the gradient restarts on the
            second line and the two halves read as different colours. */}
        <div className="grid items-center gap-14 lg:grid-cols-[1.22fr_1fr] lg:gap-10">
          {/* ---------------- copy ---------------- */}
          <div className="max-w-[46rem]">
            {/* Availability-neutral status pill: states a fact (current role
                and location) rather than claiming to be "available for hire",
                which is not mine to assert. */}
            <p className="inline-flex items-center gap-2.5 rounded-full border border-ink-600/80 bg-ink-850/60 px-3.5 py-1.5 font-mono text-[11px] tracking-wide text-mist-400 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span
                  data-motion="decorative"
                  className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jade-400 opacity-70"
                />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-jade-400" />
              </span>
              Senior Associate Software Engineer · Lentra AI
            </p>

            {/* The name carries the display size and the role sits a step
                down from it. Setting both at the same scale pushed the whole
                hero below the fold on a laptop and read as a shout. */}
            <h1 id="hero-heading" className="mt-7 font-semibold">
              <span className="block text-[length:var(--text-display-lg)] leading-[0.94] text-mist-50">
                {profile.name}
              </span>
              <span className="text-gradient mt-2 block text-[length:var(--text-display)] leading-[1.04]">
                {profile.title}
              </span>
            </h1>

            <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm text-azure-400">
              {profile.tagline}
            </p>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-mist-400 md:text-[17px]">
              {summary}
            </p>

            <TechMarquee items={profile.heroTechnologies ?? []} />

            {/* ---------------- actions ---------------- */}
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="#projects" variant="primary" size="lg">
                View projects
                <Icon
                  name="ArrowRight"
                  size={16}
                  className="transition-transform duration-300 motion-safe:group-hover:translate-x-0.5"
                />
              </ButtonLink>

              <ButtonLink href="#contact" variant="secondary" size="lg">
                <Icon name="Mail" size={16} />
                Contact me
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
                Download resume
              </ButtonLink>
            </div>

            {/* ---------------- social ---------------- */}
            {heroLinks.length > 0 && (
              <div className="mt-10 flex items-center gap-5">
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
                          className="group grid h-10 w-10 place-items-center rounded-lg border border-ink-600/80 bg-ink-850/50 text-mist-400 transition-all duration-300 hover:border-azure-500/50 hover:text-white motion-safe:hover:-translate-y-0.5"
                        >
                          <Icon name={link.icon} size={17} />
                        </a>
                      </li>
                    ) : null,
                  )}
                </ul>
                <span className="font-mono text-xs text-mist-600">
                  {profile.location}
                </span>
              </div>
            )}
          </div>

          {/* ---------------- visual ---------------- */}
          <div className="relative lg:pl-4">
            <HeroVisual />
          </div>
        </div>
      </div>

      {/* Scroll affordance. Decorative and hidden under reduced motion. */}
      <div
        data-motion="decorative"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-8 hidden justify-center md:flex"
      >
        <span className="flex flex-col items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-mist-600 uppercase">
          Scroll
          <span className="h-10 w-px bg-gradient-to-b from-ink-500 to-transparent" />
        </span>
      </div>
    </section>
  );
}
