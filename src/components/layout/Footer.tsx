import Link from "next/link";
import { getFooterLinks, getNavItems } from "@/lib/content";
import { profile } from "@/data/profile";
import { siteConfig } from "@/data/site-config";
import { Icon } from "@/components/ui/Icon";

/**
 * The footer.
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

      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* --- identity --- */}
          <div>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-9 w-9 place-items-center rounded-lg border border-ink-600 bg-ink-850 font-display text-caption font-bold text-mist-100"
              >
                {profile.monogram}
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-mist-100">
                  {profile.name}
                </p>
                <p className="text-xs text-mist-500">{profile.title}</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-mist-500">
              Backend engineering for financial data exchange — Spring Boot services,
              REST APIs and the reliability work that keeps them standing up.
            </p>
          </div>

          {/* --- navigation --- */}
          <nav aria-label="Footer">
            <h2 className="eyebrow text-mist-500">
              Navigate
            </h2>
            <ul className="mt-4 space-y-2.5">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-mist-400 transition-colors hover:text-mist-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={siteConfig.resumePath}
                  download={siteConfig.resumeDownloadName}
                  className="inline-flex items-center gap-1.5 text-sm text-mist-400 transition-colors hover:text-mist-100"
                >
                  Resume
                  <Icon name="Download" size={13} />
                </a>
              </li>
            </ul>
          </nav>

          {/* --- elsewhere --- */}
          <div>
            <h2 className="eyebrow text-mist-500">
              Elsewhere
            </h2>
            <ul className="mt-4 space-y-2.5">
              {links.map((link) => {
                if (!link.url) {
                  // No URL configured. Rendered as plain, disabled text rather
                  // than a dead anchor — an unfinished profile should look
                  // unfinished, not broken.
                  return (
                    <li key={link.id}>
                      <span
                        className="inline-flex items-center gap-2 text-sm text-mist-600"
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
                      className="group inline-flex items-center gap-2 text-sm text-mist-400 transition-colors hover:text-mist-100"
                    >
                      <Icon
                        name={link.icon}
                        size={15}
                        className="text-mist-500 transition-colors group-hover:text-azure-400"
                      />
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-800 pt-6 text-xs text-mist-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {profile.name}. All rights reserved.
          </p>
          {siteConfig.footerNote && <p>{siteConfig.footerNote}</p>}
        </div>
      </div>
    </footer>
  );
}
