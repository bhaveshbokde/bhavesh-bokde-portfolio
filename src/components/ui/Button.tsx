import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const BASE =
  "group relative inline-flex items-center justify-center gap-2 rounded-full font-medium " +
  "transition-[transform,background-color,border-color,box-shadow,color] duration-300 " +
  "motion-safe:hover:-translate-y-0.5 active:translate-y-0 " +
  "disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  // The only filled control on the page. Scarcity is what makes it read as
  // the primary action.
  primary:
    "bg-gradient-to-br from-azure-400 to-iris-500 text-ink-950 font-semibold " +
    "shadow-[0_8px_30px_-8px_rgb(59_125_245/0.55)] " +
    "hover:shadow-[0_14px_40px_-10px_rgb(139_92_246/0.65)] hover:brightness-[1.06]",
  secondary:
    "border border-ink-600 bg-ink-800/60 text-mist-100 backdrop-blur-sm " +
    "hover:border-azure-500/50 hover:bg-ink-750/80 hover:text-white",
  ghost:
    "text-mist-300 hover:text-white hover:bg-ink-800/60",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-body",
};

export interface ButtonLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  /** Adds `download` and the correct filename. For the resume PDF. */
  download?: string;
  /** Forces target=_blank + rel. Inferred from the href when not given. */
  external?: boolean;
}

/**
 * Every call to action on this site is a link, not a `<button>` — they all
 * navigate or download, and a `<button>` that navigates loses middle-click,
 * "open in new tab" and the browser's own status bar preview.
 *
 * External links get `rel="noopener noreferrer"` automatically. An anchor or
 * internal route gets Next's client-side `Link`; everything else, including
 * the resume download, stays a plain `<a>` so the browser handles it natively.
 */
export function ButtonLink({
  href,
  children,
  variant = "secondary",
  size = "md",
  className,
  download,
  external,
  ...rest
}: ButtonLinkProps) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);
  const isExternal = external ?? /^https?:\/\//.test(href);
  const isHashOrRoute = href.startsWith("#") || href.startsWith("/");

  if (isExternal) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
    );
  }

  if (download !== undefined) {
    return (
      <a href={href} download={download} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  if (isHashOrRoute) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={classes} {...rest}>
      {children}
    </a>
  );
}
