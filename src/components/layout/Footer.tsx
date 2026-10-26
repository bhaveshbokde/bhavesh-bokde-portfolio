import Link from "next/link";
import { getFooterLinks, getNavItems } from "@/lib/content";
import { profile } from "@/data/profile";
import { siteConfig } from "@/data/site-config";
import { Icon } from "@/components/ui/Icon";

/**
 * The footer.
 *
 * Given a little more presence than a row of small links usually gets: the
 * name is set large, because this is the last thing on the page and the last
 * thing worth remembering from it. The columns sit on the same hairline rails
 * the rest of the site uses, so the page ends in the same voice it started in.
 *
 * The copyright year is generated at render time rather than typed, which is
 * the single most common stale detail on a personal site. The page is
 * statically rendered, so the year is correct as of the last build — and a
 * portfolio that has not been rebuilt in over a year has bigger problems than
 * its footer.
 */
export function Footer() {
  const year = new Date().getFullYear();
  const links = getFooterLinks();
  const navItems = getNavItems();

  return (
    <footer
      data-site-footer
      className="relative mt-10 border-t border-ink-700/70 bg-ink-950/60"
    >
      {/* A single hairline of colour across the top edge. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-azure-500/40 to-transparent"
      />

      <div className="container-page py-16">
        <div className="grid gap-12 md:grid-cols-12 md:gap-10">
          {/* ───────── identity ───────── */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-10 w-10 place-items-center rounded-control border border-ink-600 bg-ink-850 font-display text-caption font-bold text-mist-100"
              >
                {profile.monogram}
              </span>
              <div>
                <p className="font-display text-lg leading-tight font-semibold text-mist-50">
                  {profile.name}
                </p>
                <p className="text-caption text-mist-500">{profile.title}</p>
              </div>
            </div>

            <p className="mt-6 max-w-sm text-body leading-[1.7] text-mist-500">
              Backend engineering for financial data exchange — Spring Boot
              services, REST APIs and the reliability work that keeps them
              standing up.
            </p>

            <a
              href={`mailto:${profile.email}`}
              className="group mt-6 inline-flex items-center gap-2 rounded-control font-mono text-caption text-mist-400 transition-colors hover:text-azure-300"
            >
              <Icon name="Mail" size={14} className="text-mist-600 transition-colors group-hover:text-azure-400" />
              {profile.email}
            </a>
          </div>

          {/* ───────── navigation ───────── */}
          <nav aria-label="Footer" className="md:col-span-3 md:col-start-7">
            <h2 className="eyebrow text-mist-600">Navigate</h2>
            <ul className="mt-5 space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-center gap-2 rounded-control py-1 text-sm text-mist-400 transition-colors hover:text-mist-100"
                  >
                    <span
                      aria-hidden="true"
                      className="h-px w-0 bg-azure-400 transition-all duration-300 group-hover:w-3"
                    />
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={siteConfig.resumePath}
                  download={siteConfig.resumeDownloadName}
                  className="group inline-flex items-center gap-2 rounded-control py-1 text-sm text-mist-400 transition-colors hover:text-mist-100"
                >
                  <span
                    aria-hidden="true"
                    className="h-px w-0 bg-azure-400 transition-all duration-300 group-hover:w-3"
                  />
                  Resume
                  <Icon name="Download" size={13} className="text-mist-600" />
                </a>
              </li>
            </ul>
          </nav>

          {/* ───────── elsewhere ───────── */}
          <div className="md:col-span-3">
            <h2 className="eyebrow text-mist-600">Elsewhere</h2>
            <ul className="mt-5 space-y-1">
              {links.map((link) => {
                if (!link.url) {
                  // No URL configured. Rendered as plain, disabled text rather
                  // than a dead anchor — an unfinished profile should look
                  // unfinished, not broken.
                  return (
                    <li key={link.id}>
                      <span
                        className="inline-flex items-center gap-2 py-1 text-sm text-mist-600"
                        title="No URL configured for this link yet."
                      >
                        <Icon name={link.icon} size={15} />
                        {link.label}
                        <span className="font-mono text-micro text-mist-600">
                          (not configured)
                        </span>
                      </span>
                    </li>
                  );
                }
                const isExternal = link.url.startsWith("http");
                return (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      {...(isExternal
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="group inline-flex items-center gap-2 rounded-control py-1 text-sm text-mist-400 transition-colors hover:text-mist-100"
                    >
                      <Icon
                        name={link.icon}
                        size={15}
                        className="text-mist-500 transition-colors group-hover:text-azure-400"
                      />
                      {link.label}
                      {isExternal && (
                        <Icon
                          name="ArrowUpRight"
                          size={12}
                          className="text-mist-600 transition-all duration-300 group-hover:text-azure-400 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                        />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-ink-800 pt-7 text-xs text-mist-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {profile.name}. All rights reserved.
          </p>
          {siteConfig.footerNote && <p>{siteConfig.footerNote}</p>}
        </div>
      </div>
    </footer>
  );
}
