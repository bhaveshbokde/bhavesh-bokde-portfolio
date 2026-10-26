import type {
  Experience,
  Listable,
  NavItem,
  Project,
  SectionId,
  Skill,
  SkillCategory,
  SocialLink,
} from "@/data/types";

import { profile } from "@/data/profile";
import { siteConfig } from "@/data/site-config";
import { skillCategories, skills } from "@/data/skills";
import { experience } from "@/data/experience";
import { projects } from "@/data/projects";
import { education } from "@/data/education";
import { socialLinks } from "@/data/social-links";

/* ------------------------------------------------------------------ */
/* Generic list helpers                                                */
/* ------------------------------------------------------------------ */

/**
 * Drops anything marked `hidden` and sorts by `order` ascending.
 *
 * Entries without an `order` keep their relative position in the source file
 * and follow the ordered ones, which makes `order` an opt-in: you only number
 * the entries you actually care about the position of.
 */
export function visibleSorted<T extends Listable>(items: readonly T[]): T[] {
  return items
    .filter((item) => item.hidden !== true)
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const ao = a.item.order;
      const bo = b.item.order;
      if (ao === undefined && bo === undefined) return a.index - b.index;
      if (ao === undefined) return 1;
      if (bo === undefined) return -1;
      if (ao !== bo) return ao - bo;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

/* ------------------------------------------------------------------ */
/* Dates and durations                                                 */
/* ------------------------------------------------------------------ */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** Parses `YYYY-MM` or `YYYY-MM-DD` into a UTC date. Returns null if unusable. */
export function parseIsoMonth(value: string | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const d = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day ?? "1")));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `"2022-09"` → `"Sep 2022"`. Falls back to the raw string if unparseable. */
export function formatMonthYear(value: string | undefined): string {
  const date = parseIsoMonth(value);
  if (!date) return value ?? "";
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** `"Sep 2022 – Present"`. An absent `end` means the role is current. */
export function formatDateRange(start: string, end?: string): string {
  const from = formatMonthYear(start);
  const to = end ? formatMonthYear(end) : "Present";
  return from ? `${from} – ${to}` : to;
}

/** Whole months between two dates, floored at zero. */
export function monthsBetween(start: Date, end: Date): number {
  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());
  return Math.max(0, months);
}

/** `"4 yrs 2 mos"`. Used on the experience timeline. */
export function formatDuration(
  start: string,
  end?: string,
  now: Date = new Date(),
): string {
  const from = parseIsoMonth(start);
  if (!from) return "";
  const to = parseIsoMonth(end) ?? now;
  const total = monthsBetween(from, to);
  const years = Math.floor(total / 12);
  const months = total % 12;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years === 1 ? "" : "s"}`);
  if (months > 0) parts.push(`${months} mo${months === 1 ? "" : "s"}`);
  return parts.length > 0 ? parts.join(" ") : "< 1 mo";
}

/**
 * Years of experience, derived rather than hardcoded.
 *
 * Rounds *down* to the nearest half year and appends a "+", which is the
 * conventional and conservative way to write it: at 4 years and 2 months this
 * returns `"4+"`, never `"4.2"` and never something flattering.
 *
 * `profile.yearsOfExperienceOverride` short-circuits this entirely, for when
 * the site needs to match a resume that is already out in the world.
 *
 * Call this from server components only. It reads the clock, so rendering it
 * on the client as well would risk a hydration mismatch at a month boundary.
 */
export function formatYearsOfExperience(now: Date = new Date()): string {
  if (profile.yearsOfExperienceOverride) {
    return profile.yearsOfExperienceOverride;
  }
  const start = parseIsoMonth(profile.careerStartDate);
  if (!start) return "";

  const totalMonths = monthsBetween(start, now);
  const halves = Math.floor(totalMonths / 6) / 2; // floor to the nearest 0.5
  if (halves <= 0) return "< 1";
  const text = Number.isInteger(halves) ? String(halves) : halves.toFixed(1);
  return `${text}+`;
}

/** Replaces `{{key}}` placeholders. Unknown keys are left untouched. */
export function interpolate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in values ? (values[key] as string) : match,
  );
}

/** The professional summary with `{{years}}` filled in. Server-side only. */
export function getSummary(now: Date = new Date()): string {
  return interpolate(profile.summary, { years: formatYearsOfExperience(now) });
}

/* ------------------------------------------------------------------ */
/* Skills                                                              */
/* ------------------------------------------------------------------ */

export interface SkillGroup {
  category: SkillCategory;
  skills: Skill[];
}

export function getSkillCategories(): SkillCategory[] {
  return visibleSorted(skillCategories);
}

export function getSkills(): Skill[] {
  return visibleSorted(skills);
}

/**
 * Skills grouped under their category, in category order.
 *
 * A category with no visible skills is dropped: hiding every skill in a group
 * should remove the group and its filter chip too, not leave an empty card.
 */
export function getSkillGroups(): SkillGroup[] {
  const visibleSkills = getSkills();
  return getSkillCategories()
    .map((category) => ({
      category,
      skills: visibleSkills.filter((skill) => skill.category === category.id),
    }))
    .filter((group) => group.skills.length > 0);
}

/* ------------------------------------------------------------------ */
/* Experience, education, projects, links                              */
/* ------------------------------------------------------------------ */

export function getExperience(): Experience[] {
  return visibleSorted(experience);
}

export function getEducation() {
  return visibleSorted(education);
}

export function getProjects(): Project[] {
  return visibleSorted(projects);
}

export function getProjectsByKind(kind: Project["kind"]): Project[] {
  return getProjects().filter((project) => project.kind === kind);
}

/** The project rendered as the dedicated case study — the first featured professional one. */
export function getCaseStudyProject(): Project | undefined {
  return getProjects().find(
    (project) => project.kind === "professional" && project.featured === true,
  );
}

export function getProjectBySlug(slug: string): Project | undefined {
  // Deliberately searches the unfiltered list: a hidden project should still
  // resolve if you navigate straight to its URL while drafting it.
  return projects.find((project) => project.slug === slug);
}

export function getSocialLinks(): SocialLink[] {
  return visibleSorted(socialLinks);
}

export function getHeroLinks(): SocialLink[] {
  return getSocialLinks().filter((link) => link.showInHero === true);
}

export function getFooterLinks(): SocialLink[] {
  return getSocialLinks().filter((link) => link.showInFooter !== false);
}

/* ------------------------------------------------------------------ */
/* Navigation and sections                                             */
/* ------------------------------------------------------------------ */

export function getNavItems(): NavItem[] {
  return visibleSorted(siteConfig.nav);
}

export function isSectionEnabled(id: SectionId): boolean {
  return siteConfig.sections.includes(id);
}

/** Section ids in the order configured, so the page order follows the config. */
export function getEnabledSections(): SectionId[] {
  return siteConfig.sections;
}
