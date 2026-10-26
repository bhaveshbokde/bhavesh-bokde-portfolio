/**
 * Joins class names, dropping anything falsy.
 *
 * Small enough not to warrant a dependency: this site has no runtime class
 * conflicts to resolve, so `clsx` + `tailwind-merge` would be two packages
 * earning their keep on nothing.
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
