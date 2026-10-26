import { profile } from "@/data/profile";
import { siteConfig } from "@/data/site-config";
import { getSocialLinks } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { CopyEmail } from "@/components/ui/CopyEmail";

interface Channel {
  id: string;
  label: string;
  value: string;
  href?: string;
  icon: string;
  external?: boolean;
}

/**
 * Contact — the closing statement of the page.
 *
 * The address itself is the hero. Everything else on a contact section is
 * decoration around one piece of information, so that piece is set large, in
 * mono, as the thing you land on; the buttons underneath are the two actions
 * worth offering, and the rest of the channels sit quietly below a hairline.
 *
 * The email appears exactly once. An earlier arrangement printed it as a
 * headline *and* again as a row in the channel list, which is the kind of
 * duplication that reads as an oversight and makes a screen reader say it
 * twice.
 *
 * There is no contact form, and that is a decision rather than an omission. A
 * form on a statically hosted site needs a backend or a third-party endpoint;
 * without one it is a box that eats messages while looking like it worked. The
 * README documents how to add a real one — a route handler with server-side
 * validation and a spam check, or a hosted service — if that is ever wanted.
 * No API key would live in this repository either way.
 *
 * `profile.phone` is optional: omit it and the row disappears.
 */
export function Contact() {
  const socials = getSocialLinks().filter((link) => link.id !== "email");

  // Note the absence of an email entry — it is the headline above.
  const channels: Channel[] = [
    ...(profile.phone
      ? [
          {
            id: "phone",
            label: "Phone",
            value: profile.phone,
            // Strip spaces for the dial href; keep them in the display value.
            href: `tel:${profile.phone.replace(/\s+/g, "")}`,
            icon: "Phone",
          } satisfies Channel,
        ]
      : []),
    ...socials.map((link) => ({
      id: link.id,
      label: link.label,
      value: link.handle ?? link.label,
      href: link.url,
      icon: link.icon,
      external: true,
    })),
    {
      id: "location",
      label: "Location",
      value: profile.location,
      icon: "MapPin",
    },
  ];

  return (
    <Section
      id="contact"
      eyebrow="07 — Contact"
      title="Let's talk about backend work"
      description={siteConfig.contactForm.note}
      align="center"
    >
      <Reveal>
        <div className="relative overflow-hidden rounded-panel border border-ink-600/80 px-6 py-12 md:px-12 md:py-16">
          {/* Lighting for the panel. Static, so it costs nothing. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-br from-azure-500/[0.07] via-ink-900/60 to-iris-500/[0.07]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-azure-400/50 to-transparent"
          />
          <div
            aria-hidden="true"
            className="bg-grid absolute inset-0 -z-10 opacity-[0.35]"
          />

          <div className="mx-auto max-w-3xl text-center">
            <h3 className="font-display text-[length:var(--text-display-sm)] leading-[1.1] font-semibold text-balance text-mist-50">
              Open to conversations about backend engineering roles
            </h3>

            <p className="mx-auto mt-5 max-w-xl text-body leading-[1.7] text-mist-400 md:text-base">
              Spring Boot services, API design, fintech integrations and the
              production work that holds them together. The fastest way to reach
              me is email — I read it properly.
            </p>

            {/* ───────── the address itself ───────── */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
              <a
                href={`mailto:${profile.email}`}
                aria-label={`Email: ${profile.email}`}
                className="group rounded-control font-mono text-lg tracking-tight text-mist-50 transition-colors hover:text-white md:text-2xl"
              >
                <span className="bg-gradient-to-r from-azure-400 to-iris-400 bg-[length:100%_1px] bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-500 group-hover:bg-[length:0%_1px]">
                  {profile.email}
                </span>
              </a>
              <CopyEmail email={profile.email} />
            </div>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <ButtonLink
                href={`mailto:${profile.email}`}
                variant="primary"
                size="lg"
              >
                <Icon name="Mail" size={16} />
                Email me
              </ButtonLink>
              <ButtonLink
                href={siteConfig.resumePath}
                download={siteConfig.resumeDownloadName}
                variant="secondary"
                size="lg"
              >
                <Icon name="Download" size={16} />
                Download resume
              </ButtonLink>
            </div>
          </div>

          {/* ───────── other channels ─────────
              A hairline rail rather than a grid of boxes: these are secondary
              to the address above, and boxing them gave them equal weight. */}
          {channels.length > 0 && (
            <dl className="mx-auto mt-12 grid max-w-3xl gap-px overflow-hidden border-t border-ink-700/60 pt-8 sm:grid-cols-3">
              {channels.map((channel) => {
                const content = (
                  <>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-ink-700 bg-ink-850/70 text-mist-400 transition-colors duration-300 group-hover:border-azure-500/50 group-hover:text-azure-300">
                      <Icon name={channel.icon} size={15} />
                    </span>
                    <span className="min-w-0 text-left">
                      <dt className="eyebrow-sm text-mist-600">
                        {channel.label}
                      </dt>
                      <dd className="truncate text-sm text-mist-200">
                        {channel.value}
                      </dd>
                    </span>
                  </>
                );

                const className =
                  "group flex items-center gap-3 rounded-control px-2 py-3 transition-colors";

                if (!channel.href) {
                  return (
                    <div key={channel.id} className={className}>
                      {content}
                    </div>
                  );
                }

                return (
                  <a
                    key={channel.id}
                    href={channel.href}
                    {...(channel.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className={`${className} hover:bg-ink-850/50`}
                    aria-label={
                      channel.external
                        ? `${channel.label}: ${channel.value} (opens in a new tab)`
                        : `${channel.label}: ${channel.value}`
                    }
                  >
                    {content}
                    <Icon
                      name="ArrowUpRight"
                      size={14}
                      className="ml-auto shrink-0 text-mist-600 transition-all duration-300 group-hover:text-azure-300 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                    />
                  </a>
                );
              })}
            </dl>
          )}
        </div>
      </Reveal>
    </Section>
  );
}
