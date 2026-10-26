import Link from "next/link";
import type { Metadata } from "next";
import { getNavItems } from "@/lib/content";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page does not exist.",
  robots: { index: false, follow: true },
};

/**
 * The 404 page.
 *
 * Styled like the rest of the site rather than left as the framework default,
 * and it offers a way back rather than just stating the problem. The links are
 * generated from the same nav config as the header, so they cannot drift.
 */
export default function NotFound() {
  const navItems = getNavItems();

  return (
    <section className="relative flex min-h-[80vh] items-center py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-label tracking-[0.3em] text-azure-400 uppercase">
            Error 404
          </p>

          <p
            aria-hidden="true"
            className="text-gradient mt-6 font-display text-[clamp(5rem,18vw,11rem)] leading-none font-bold"
          >
            404
          </p>

          <h1 className="mt-2 font-display text-2xl font-semibold text-mist-50 md:text-3xl">
            This page doesn&apos;t exist
          </h1>

          <p className="mt-4 text-base leading-relaxed text-mist-400">
            The link may be out of date, or the address may have a typo in it.
            Everything on this site is reachable from the home page.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/" variant="primary" size="lg">
              <Icon name="ArrowRight" size={16} className="rotate-180" />
              Back to home
            </ButtonLink>
            <ButtonLink href="/#projects" variant="secondary" size="lg">
              View projects
            </ButtonLink>
          </div>

          <nav aria-label="Site sections" className="mt-12">
            <p className="eyebrow text-mist-600">
              Or jump to
            </p>
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href.startsWith("#") ? `/${item.href}` : item.href}
                    className="inline-flex rounded-full border border-ink-600/80 bg-ink-850/50 px-4 py-2 text-sm text-mist-400 transition-colors hover:border-azure-500/50 hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </section>
  );
}
