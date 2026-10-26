/**
 * Joins class names, dropping anything falsy.
 *
 * Small enough not to warrant a dependency: `clsx` + `tailwind-merge` would be
 * two packages doing work this project can do in one line.
 *
 * **It does not resolve conflicts.** If two classes set the same property, both
 * end up in the attribute and the winner is decided by the order Tailwind
 * happened to emit them in the stylesheet — not by the order they were passed
 * here. That bites in exactly one pattern: passing a utility to a component
 * that already sets the same property itself.
 *
 *     <SourceBadge className="hidden sm:inline-flex" />   // ✗ badge sets
 *                                                         //   inline-flex and
 *                                                         //   wins; stays
 *                                                         //   visible
 *     <span className="hidden sm:block">                  // ✓ nothing to
 *       <SourceBadge />                                   //   conflict with
 *     </span>
 *
 * Both real occurrences of the broken form shipped before being caught — one
 * squeezed a failure title to 43px on a phone, the other showed a header
 * button that was meant to be hidden. Wrap the component instead.
 */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/** Turns "Spring Boot 3.5" into "spring-boot-3-5" for use as a React key or id. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
