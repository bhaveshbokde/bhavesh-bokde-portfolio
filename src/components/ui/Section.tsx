import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export interface SectionProps {
  /** Becomes the element id, so `#id` anchors and the nav links resolve here. */
  id: string;
  /** Small label above the heading, e.g. "03 — Projects". */
  eyebrow?: string;
  title: string;
  /** One or two sentences under the heading. */
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Renders a faded hairline above the section. */
  divider?: boolean;
  /** Width of the heading block. Narrow keeps intros readable. */
  align?: "left" | "center";
}

/**
 * The standard section shell: anchor target, eyebrow, heading, intro.
 *
 * Every section on the page goes through this, which is what makes the
 * vertical rhythm consistent without anyone re-deciding padding each time.
 * The heading is always an `h2` and the page's only `h1` lives in the hero,
 * so the document outline is correct for a screen reader reading it top to
 * bottom.
 */
export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  divider = true,
  align = "left",
}: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("relative scroll-mt-24 py-20 md:py-28", className)}
    >
      {divider && (
        <div className="container-page" aria-hidden="true">
          <div className="rule-fade mb-20 md:mb-28" />
        </div>
      )}

      <div className="container-page">
        <Reveal>
          <header
            className={cn(
              "mb-12 max-w-3xl md:mb-16",
              align === "center" && "mx-auto text-center",
            )}
          >
            {eyebrow && (
              <p className="mb-4 flex items-center gap-3 font-mono text-xs tracking-display text-azure-400 uppercase">
                <span
                  aria-hidden="true"
                  className="h-px w-8 bg-gradient-to-r from-azure-500/80 to-transparent"
                />
                {eyebrow}
              </p>
            )}
            <h2
              id={headingId}
              className="text-[length:var(--text-display-sm)] leading-[1.08] font-semibold"
            >
              {title}
            </h2>
            {description && (
              <div className="mt-5 text-base leading-relaxed text-mist-400 md:text-lg">
                {description}
              </div>
            )}
          </header>
        </Reveal>

        {children}
      </div>
    </section>
  );
}
