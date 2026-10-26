import { profile } from "@/data/profile";
import { siteConfig } from "@/data/site-config";
import { getSocialLinks } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";

interface Channel {
  id: string;
  label: string;
  value: string;
  href?: string;
  icon: string;
  external?: boolean;
}

/**
 * Contact.
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

  const channels: Channel[] = [
    {
      id: "email",
      label: "Email",
      value: profile.email,
      href: `mailto:${profile.email}`,
      icon: "Mail",
    },
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
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-ink-600/80 p-8 md:p-12">
          {/* Lighting for the panel. Static, so it costs nothing. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-br from-azure-500/[0.07] via-ink-900/60 to-iris-500/[0.07]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-azure-400/50 to-transparent"
          />

          <div className="text-center">
            <h3 className="font-display text-2xl font-semibold text-mist-50 md:text-3xl">
              Open to conversations about backend engineering roles
            </h3>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-mist-400 md:text-base">
              Spring Boot services, API design, fintech integrations and the
              production work that holds them together. The fastest way to reach
              me is email — I read it properly.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href={`mailto:${profile.email}`} variant="primary" size="lg">
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

          {/* ---------------- channels ---------------- */}
          <dl className="mt-10 grid gap-3 border-t border-ink-700/60 pt-8 sm:grid-cols-2">
            {channels.map((channel) => {
              const content = (
                <>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-ink-600 bg-ink-850 text-mist-400 transition-colors group-hover:border-azure-500/50 group-hover:text-azure-300">
                    <Icon name={channel.icon} size={15} />
                  </span>
                  <span className="min-w-0 text-left">
                    <dt className="font-mono text-[10px] tracking-[0.18em] text-mist-600 uppercase">
                      {channel.label}
                    </dt>
                    <dd className="truncate text-sm text-mist-200">{channel.value}</dd>
                  </span>
                </>
              );

              const className =
                "group flex items-center gap-3.5 rounded-xl border border-ink-700/60 bg-ink-900/40 px-4 py-3 transition-colors";

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
                  className={`${className} hover:border-azure-500/40 hover:bg-ink-850/60`}
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
                    className="ml-auto shrink-0 text-mist-600 transition-colors group-hover:text-azure-300"
                  />
                </a>
              );
            })}
          </dl>
        </div>
      </Reveal>
    </Section>
  );
}
