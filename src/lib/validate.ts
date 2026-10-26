import { skillCategories as defaultSkillCategories, skills as defaultSkills } from "@/data/skills";
import { projects as defaultProjects } from "@/data/projects";
import { experience as defaultExperience } from "@/data/experience";
import { socialLinks as defaultSocialLinks } from "@/data/social-links";
import { siteConfig as defaultSiteConfig } from "@/data/site-config";
import { profile as defaultProfile } from "@/data/profile";
import { parseIsoMonth } from "./content";
import type {
  Experience,
  Profile,
  Project,
  SiteConfig,
  Skill,
  SkillCategory,
  SocialLink,
} from "@/data/types";

/**
 * Content validation.
 *
 * The point of this file is that a typo in `src/data/` becomes a loud build
 * failure naming the offending entry, rather than a silently missing card that
 * nobody notices for a month.
 *
 * It checks the things that are actually wrong rather than everything that
 * could conceivably be checked: broken references between files, duplicate
 * keys, malformed dates, and the few fields where "present but empty" is a
 * mistake. Optional fields being absent is never an error — that is the whole
 * point of them being optional.
 */

export interface ValidationIssue {
  /** Which file the problem is in, e.g. `src/data/skills.ts`. */
  source: string;
  message: string;
}

/**
 * Everything the validator looks at.
 *
 * Taking the content as an argument rather than reaching for the modules
 * directly is what makes the rules testable: a test can hand in a deliberately
 * broken skill and assert the right complaint comes back, without having to
 * break the real data files to do it.
 */
export interface ContentBundle {
  profile: Profile;
  skillCategories: SkillCategory[];
  skills: Skill[];
  experience: Experience[];
  projects: Project[];
  socialLinks: SocialLink[];
  siteConfig: SiteConfig;
}

/** The site's real content — what the build validates. */
export const defaultContent: ContentBundle = {
  profile: defaultProfile,
  skillCategories: defaultSkillCategories,
  skills: defaultSkills,
  experience: defaultExperience,
  projects: defaultProjects,
  socialLinks: defaultSocialLinks,
  siteConfig: defaultSiteConfig,
};

const ISO_MONTH = /^\d{4}-\d{2}(-\d{2})?$/;

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }
  return [...dupes];
}

function isLikelyUrl(value: string): boolean {
  return /^(https?:\/\/|mailto:|tel:|\/|#)/.test(value);
}

export function validateContent(
  content: ContentBundle = defaultContent,
): ValidationIssue[] {
  const { profile, skillCategories, skills, experience, projects, socialLinks, siteConfig } =
    content;

  const issues: ValidationIssue[] = [];
  const push = (source: string, message: string) => issues.push({ source, message });

  /* ----- profile ------------------------------------------------- */
  if (!profile.name.trim()) push("src/data/profile.ts", "`name` must not be empty.");
  if (!profile.email.includes("@")) {
    push("src/data/profile.ts", `\`email\` does not look like an address: "${profile.email}"`);
  }
  if (!ISO_MONTH.test(profile.careerStartDate)) {
    push(
      "src/data/profile.ts",
      `\`careerStartDate\` must be YYYY-MM or YYYY-MM-DD, got "${profile.careerStartDate}".`,
    );
  }
  if (profile.about.length === 0) {
    push("src/data/profile.ts", "`about` needs at least one paragraph.");
  }

  /* ----- skill categories ---------------------------------------- */
  const categoryIds = skillCategories.map((c) => c.id);
  for (const dupe of duplicates(categoryIds)) {
    push("src/data/skills.ts", `Duplicate skill category id "${dupe}".`);
  }

  /* ----- skills --------------------------------------------------- */
  const knownCategories = new Set(categoryIds);
  for (const dupe of duplicates(skills.map((s) => s.id))) {
    push("src/data/skills.ts", `Duplicate skill id "${dupe}".`);
  }
  for (const skill of skills) {
    if (!skill.name.trim()) {
      push("src/data/skills.ts", `Skill "${skill.id}" has an empty name.`);
    }
    if (!knownCategories.has(skill.category)) {
      push(
        "src/data/skills.ts",
        `Skill "${skill.id}" references category "${skill.category}", which is not in ` +
          `skillCategories. Known categories: ${categoryIds.join(", ")}.`,
      );
    }
  }

  /* ----- experience ------------------------------------------------ */
  for (const dupe of duplicates(experience.map((e) => e.id))) {
    push("src/data/experience.ts", `Duplicate experience id "${dupe}".`);
  }
  for (const role of experience) {
    if (!ISO_MONTH.test(role.startDate)) {
      push(
        "src/data/experience.ts",
        `"${role.id}" has startDate "${role.startDate}"; expected YYYY-MM or YYYY-MM-DD.`,
      );
    }
    if (role.endDate !== undefined) {
      if (!ISO_MONTH.test(role.endDate)) {
        push(
          "src/data/experience.ts",
          `"${role.id}" has endDate "${role.endDate}"; expected YYYY-MM or YYYY-MM-DD, ` +
            `or omit it entirely for a current role.`,
        );
      } else {
        const start = parseIsoMonth(role.startDate);
        const end = parseIsoMonth(role.endDate);
        if (start && end && end < start) {
          push("src/data/experience.ts", `"${role.id}" ends before it starts.`);
        }
      }
    }
    if (role.highlights.length === 0) {
      push("src/data/experience.ts", `"${role.id}" has no highlights.`);
    }
  }

  /* ----- projects -------------------------------------------------- */
  for (const dupe of duplicates(projects.map((p) => p.slug))) {
    push("src/data/projects.ts", `Duplicate project slug "${dupe}" — slugs become URLs.`);
  }
  for (const project of projects) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(project.slug)) {
      push(
        "src/data/projects.ts",
        `Project slug "${project.slug}" should be lowercase kebab-case; it is used as a URL.`,
      );
    }
    if (project.stack.length === 0) {
      push("src/data/projects.ts", `"${project.slug}" has an empty stack.`);
    }
    if (project.preview && !project.previewAlt) {
      push(
        "src/data/projects.ts",
        `"${project.slug}" sets \`preview\` without \`previewAlt\`. Every image needs ` +
          `alternative text.`,
      );
    }
    if (project.kind === "professional" && !project.confidentialityNote) {
      push(
        "src/data/projects.ts",
        `"${project.slug}" is a professional project and must carry a ` +
          `\`confidentialityNote\` saying what is and is not shown.`,
      );
    }
    for (const link of project.links ?? []) {
      if (link.url !== undefined && !isLikelyUrl(link.url)) {
        push(
          "src/data/projects.ts",
          `"${project.slug}" link "${link.label}" has a suspicious url: "${link.url}".`,
        );
      }
    }
    for (const section of project.caseStudy ?? []) {
      if (!section.body?.length && !section.bullets?.length) {
        push(
          "src/data/projects.ts",
          `"${project.slug}" case-study section "${section.id}" has neither body nor bullets.`,
        );
      }
    }
  }

  /* ----- social links ----------------------------------------------- */
  for (const dupe of duplicates(socialLinks.map((l) => l.id))) {
    push("src/data/social-links.ts", `Duplicate social link id "${dupe}".`);
  }
  for (const link of socialLinks) {
    if (link.url !== undefined && !isLikelyUrl(link.url)) {
      push("src/data/social-links.ts", `"${link.id}" has a suspicious url: "${link.url}".`);
    }
  }

  /* ----- site config ------------------------------------------------- */
  if (!siteConfig.resumePath.startsWith("/")) {
    push(
      "src/data/site-config.ts",
      `\`resumePath\` must be a path under public/, starting with "/". ` +
        `Got "${siteConfig.resumePath}".`,
    );
  }
  for (const item of siteConfig.nav) {
    if (!isLikelyUrl(item.href)) {
      push("src/data/site-config.ts", `Nav item "${item.label}" has an odd href "${item.href}".`);
    }
  }
  if (siteConfig.sections.length === 0) {
    push("src/data/site-config.ts", "`sections` is empty — the page would render nothing.");
  }

  return issues;
}

/**
 * Throws if the content is invalid.
 *
 * Imported by `src/app/layout.tsx`, so a broken data file fails `next build`
 * with a message that names the file and the entry — not a blank section in
 * production.
 */
export function assertContentIsValid(
  content: ContentBundle = defaultContent,
): void {
  const issues = validateContent(content);
  if (issues.length === 0) return;

  const report = issues
    .map((issue, index) => `  ${index + 1}. [${issue.source}] ${issue.message}`)
    .join("\n");

  throw new Error(
    `Portfolio content validation failed with ${issues.length} issue(s):\n${report}\n`,
  );
}
