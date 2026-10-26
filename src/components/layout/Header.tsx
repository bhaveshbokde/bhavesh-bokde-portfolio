"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NavItem } from "@/data/types";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { CommandPalette, type Command } from "@/components/ui/CommandPalette";

export interface HeaderProps {
  monogram: string;
  name: string;
  navItems: NavItem[];
  resumePath: string;
  resumeDownloadName: string;
  /** Commands for the ⌘K palette, derived in `getCommands()`. */
  commands: Command[];
}

/**
 * The sticky site header.
 *
 * Accessibility decisions worth stating, because a mobile menu is where
 * keyboard support is usually quietly dropped:
 *
 * - The toggle is a real `<button>` with `aria-expanded` and `aria-controls`.
 * - Opening moves focus into the panel; closing returns it to the toggle, so a
 *   keyboard user never gets dropped at the top of the document.
 * - Tab is trapped inside the panel while it is open — otherwise focus walks
 *   off into the page behind the overlay, which is invisible and
 *   unrecoverable.
 * - Escape closes it, and so does any navigation.
 * - Body scroll is locked while open, so the page behind does not scroll under
 *   the overlay.
 *
 * The active-section underline uses one IntersectionObserver over the section
 * elements rather than a scroll handler, so nothing runs per frame.
 */
export function Header({
  monogram,
  name,
  navItems,
  resumePath,
  resumeDownloadName,
  commands,
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* --- condensed header once the page has moved ------------------- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* --- active section --------------------------------------------- */
  useEffect(() => {
    const anchors = navItems.filter((item) => item.href.startsWith("#"));
    if (anchors.length === 0 || typeof IntersectionObserver === "undefined") return;

    const sections = anchors
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((element): element is HTMLElement => element !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveHref(`#${visible.target.id}`);
      },
      // The top margin keeps the header's own height out of the calculation.
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.01, 0.25, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [navItems]);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  /* --- escape, focus trap, scroll lock ----------------------------- */
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    // Move focus into the panel so the next Tab lands somewhere sensible.
    const firstLink = panelRef.current?.querySelector<HTMLElement>("a, button");
    firstLink?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  const linkClass = (href: string) =>
    cn(
      "relative rounded-md px-3 py-2 text-sm transition-colors duration-200",
      activeHref === href ? "text-white" : "text-mist-400 hover:text-mist-100",
    );

  return (
    <header
      data-site-header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-ink-700/70 bg-ink-950/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-page">
        <div className="flex h-18 items-center justify-between gap-4 py-3">
          {/* --- monogram / name --- */}
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-lg"
            aria-label={`${name} — home`}
          >
            <span
              aria-hidden="true"
              className="relative grid h-9 w-9 place-items-center rounded-lg border border-ink-600 bg-ink-850 font-display text-[13px] font-bold tracking-tight text-mist-100 transition-colors duration-300 group-hover:border-azure-500/60"
            >
              <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-azure-500/20 to-iris-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative">{monogram}</span>
            </span>
            <span className="hidden font-display text-sm font-semibold tracking-tight text-mist-100 sm:inline">
              {name}
            </span>
          </Link>

          {/* --- desktop nav --- */}
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
                aria-current={activeHref === item.href ? "true" : undefined}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-azure-400 to-iris-400 transition-opacity duration-300",
                    activeHref === item.href ? "opacity-100" : "opacity-0",
                  )}
                />
              </Link>
            ))}
          </nav>

          {/* --- actions --- */}
          <div className="flex items-center gap-2">
            <CommandPalette commands={commands} />

            <ButtonLink
              href={resumePath}
              download={resumeDownloadName}
              variant="secondary"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Icon name="Download" size={15} />
              Resume
            </ButtonLink>

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid h-10 w-10 place-items-center rounded-lg border border-ink-600 bg-ink-850/80 text-mist-200 transition-colors hover:border-azure-500/50 hover:text-white lg:hidden"
            >
              <Icon name={open ? "X" : "Menu"} size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* --- mobile panel --- */}
      {open && (
        <>
          <div
            className="fixed inset-0 top-18 z-40 bg-ink-950/70 backdrop-blur-sm lg:hidden"
            onClick={close}
            aria-hidden="true"
          />
          <div
            id="mobile-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-x-0 top-18 z-50 border-b border-ink-700 bg-ink-900/95 backdrop-blur-xl lg:hidden"
          >
            <nav aria-label="Mobile" className="container-page py-4">
              <ul className="flex flex-col">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className="flex items-center justify-between rounded-lg px-3 py-3.5 text-base text-mist-200 transition-colors hover:bg-ink-800 hover:text-white"
                      aria-current={activeHref === item.href ? "true" : undefined}
                    >
                      {item.label}
                      <Icon name="ArrowUpRight" size={16} className="text-mist-500" />
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-3 border-t border-ink-700 pt-4">
                <ButtonLink
                  href={resumePath}
                  download={resumeDownloadName}
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={close}
                >
                  <Icon name="Download" size={16} />
                  Download resume
                </ButtonLink>
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
