/**
 * Content types for the portfolio.
 *
 * Everything the site displays is described here. The rule the whole project
 * follows: **components render data, they never contain data.** If you want to
 * change what the site says, edit a file in `src/data/` — you should never need
 * to open a component to add a skill, a project or a job.
 *
 * Two conventions apply to every entry in every list:
 *
 * - `hidden: true` removes the entry from the site without deleting it, so you
 *   can park something rather than lose it.
 * - `order` sorts the list ascending. Entries without an `order` keep their
 *   position in the file, after the ordered ones.
 *
 * Optional fields are genuinely optional: every component is written to render
 * correctly when they are absent. There is a test that proves this
 * (`src/lib/content.test.ts`), so it stays true.
 */

/** Mixed into every list entry: lets you hide and reorder without deleting. */
export interface Listable {
  /** Hide from the site without deleting the entry. Defaults to `false`. */
  hidden?: boolean;
  /** Ascending sort key. Unordered entries follow ordered ones, in file order. */
  order?: number;
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export interface Profile {
  name: string;
  /** Short form used in the navigation bar and footer. */
  shortName: string;
  /** Two or three letters for the monogram mark. */
  monogram: string;
  title: string;
  /** One line under the title in the hero. Keep it to a single sentence. */
  tagline: string;
  location: string;
  email: string;
  /** International format, e.g. "+91 8830076645". Omit to hide the phone row. */
  phone?: string;

  /**
   * Technologies called out in the hero, in order. Every entry must also exist
   * in `src/data/skills.ts` — validation enforces it, so the hero and the
   * skills section cannot drift apart.
   */
  heroTechnologies?: string[];

  /**
   * The month work started, ISO `YYYY-MM-DD`. Years of experience are derived
   * from this so the number on the site never goes stale — see
   * `formatYearsOfExperience()` in `src/lib/content.ts`.
   */
  careerStartDate: string;

  /**
   * Set this only if you want to override the derived figure (for example to
   * match a resume you have already sent out). Leave it undefined and the site
   * keeps itself current.
   */
  yearsOfExperienceOverride?: string;

  /**
   * The professional summary. `{{years}}` is replaced with the derived (or
   * overridden) years-of-experience string.
   */
  summary: string;

  /** Longer "About" copy. Each string is a paragraph. */
  about: string[];

  /**
   * Extra "About" paragraphs shown behind a "Read more" control. Optional —
   * omit it and no expand control is rendered.
   */
  aboutExpanded?: string[];

  /** Short, factual statements shown as a strip under the About copy. */
  facts?: Fact[];
}

export interface Fact extends Listable {
  label: string;
  value: string;
  /** Optional one-line clarification shown under the value. */
  note?: string;
}

/* ------------------------------------------------------------------ */
/* Skills                                                              */
/* ------------------------------------------------------------------ */

export interface SkillCategory extends Listable {
  id: string;
  label: string;
  /** One line explaining what the category covers. Optional. */
  description?: string;
  /** Lucide icon name, resolved in `src/components/ui/Icon.tsx`. Optional. */
  icon?: string;
}

export interface Skill extends Listable {
  /** Stable key. Used for React keys, filters and deep links. */
  id: string;
  name: string;
  /** Must match a `SkillCategory.id`. Validated at module load. */
  category: string;
  /** One line on how it is used. Optional. */
  description?: string;

  /**
   * A free-text label such as "Daily driver" or "Used on AAConnect".
   *
   * Deliberately a string and not a number: this site shows no percentage
   * ratings or star counts, because nobody can defend "Java 87%" in an
   * interview. Leave it undefined unless you have something true to say.
   */
  proficiency?: string;

  /**
   * `true` only where production use is directly evidenced by the resume or
   * the work described in the experience entries. Renders a small marker.
   * Leave it undefined when you are not sure — an absent marker claims nothing.
   */
  usedInProduction?: boolean;
}

/* ------------------------------------------------------------------ */
/* Experience                                                          */
/* ------------------------------------------------------------------ */

export interface Experience extends Listable {
  id: string;
  role: string;
  company: string;
  /** Optional link to the company. */
  companyUrl?: string;
  location?: string;
  /** ISO `YYYY-MM` or `YYYY-MM-DD`. */
  startDate: string;
  /** Omit for a current role — the UI renders "Present" and keeps it live. */
  endDate?: string;
  /** Employment type, e.g. "Full-time". Optional. */
  employmentType?: string;
  /** One-paragraph framing shown above the bullets. Optional. */
  summary?: string;
  /** The responsibilities and work. Rendered as a list. */
  highlights: ExperienceHighlight[];
  /** Technologies used in this role. Free-form strings, rendered as tags. */
  stack?: string[];
}

export interface ExperienceHighlight {
  text: string;
  /**
   * Marks a claim that comes from the resume rather than from something
   * independently measured on this site. The UI renders an explicit
   * "resume-reported" note so the figure is never passed off as a fresh
   * measurement.
   */
  resumeReported?: boolean;
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

/**
 * `professional` — work done as part of a job, on a codebase owned by the
 * employer. These are described, never published: no source, no internal URLs,
 * no proprietary detail.
 *
 * `independent` — personally owned repositories that can be linked and read.
 */
export type ProjectKind = "professional" | "independent";

/**
 * Honest status vocabulary. Nothing is called "complete" unless it is, and
 * nothing is called "deployed" unless there is a URL that answers.
 */
export type ProjectStatus =
  | "complete"
  | "in-development"
  | "planned"
  | "maintained";

export interface ProjectLink {
  label: string;
  /**
   * Leave as `undefined` (or omit the whole link) when there is no URL yet.
   * The UI renders a "link not configured" affordance rather than a dead
   * anchor, so a missing URL is visible to you and harmless to a visitor.
   */
  url?: string;
  kind?: "repository" | "demo" | "docs" | "other";
}

export interface ProjectMetric {
  label: string;
  value: string;
  /** Where the number comes from, e.g. "measured by JaCoCo". Optional. */
  source?: string;
}

export interface CaseStudySection {
  /** Stable key for the in-page table of contents. */
  id: string;
  heading: string;
  /** Paragraphs. */
  body?: string[];
  /** Bullet list rendered under the paragraphs. */
  bullets?: string[];
}

export interface Project extends Listable {
  /** URL segment for the detail page: `/projects/<slug>`. */
  slug: string;
  name: string;
  kind: ProjectKind;
  status: ProjectStatus;
  /** Short category label, e.g. "Fintech platform". */
  category: string;
  /** One sentence. Shown on the card. */
  summary: string;
  /** The problem the project solves. Shown on the detail page. */
  problem?: string;
  /** Headline features. */
  features?: string[];
  /** Technologies. Rendered as tags on the card and the detail page. */
  stack: string[];
  /** Architecture and design decisions, as paragraphs. */
  architecture?: string[];
  /** Notable implementation details. */
  implementation?: string[];
  /** How the project is tested, and what is actually verified. */
  testing?: string[];
  /** Verified figures only. Each should carry a `source`. */
  metrics?: ProjectMetric[];
  links?: ProjectLink[];
  /** Path to a local preview image under `public/`. Optional. */
  preview?: string;
  /** Alt text for the preview. Required whenever `preview` is set. */
  previewAlt?: string;
  /**
   * Renders the explorable architecture diagram defined in
   * `src/data/architecture.ts` instead of the static `preview` image.
   *
   * Only one project should set this — the diagram data is specific to it.
   * The static `preview` is still used for the project card, where an
   * interactive diagram would be too small to operate.
   */
  interactiveArchitecture?: boolean;
  /**
   * `true` promotes the project into the featured slot and gives it a richer
   * card treatment.
   */
  featured?: boolean;
  /**
   * A notice rendered prominently on professional projects: what can and
   * cannot be shown. Optional for independent work.
   */
  confidentialityNote?: string;
  /** Long-form case study, rendered on the detail page. */
  caseStudy?: CaseStudySection[];
  /** Optional closing "what I learned" list. */
  lessons?: string[];
  /** Accent used for the card's gradient treatment. */
  accent?: "blue" | "violet" | "cyan" | "amber" | "emerald";
}

/* ------------------------------------------------------------------ */
/* Education                                                           */
/* ------------------------------------------------------------------ */

export interface Education extends Listable {
  id: string;
  degree: string;
  field?: string;
  institution: string;
  /** Awarding university, where it differs from the college. Optional. */
  affiliation?: string;
  location?: string;
  startYear: string;
  endYear: string;
  /** Optional extra detail. No grades are shown unless you add them here. */
  details?: string[];
}

/* ------------------------------------------------------------------ */
/* Social links                                                        */
/* ------------------------------------------------------------------ */

export interface SocialLink extends Listable {
  id: string;
  label: string;
  /** Leave undefined for a profile you have not created yet. */
  url?: string;
  /** Lucide icon name, or one of the custom marks in `Icon.tsx`. */
  icon: string;
  /** Shown next to the link, e.g. "@bhaveshbokde". Optional. */
  handle?: string;
  /** Show in the hero's inline link row. */
  showInHero?: boolean;
  /** Show in the footer. Defaults to `true`. */
  showInFooter?: boolean;
}

/* ------------------------------------------------------------------ */
/* Site configuration                                                  */
/* ------------------------------------------------------------------ */

export type SectionId =
  | "hero"
  | "about"
  | "experience"
  | "case-study"
  | "projects"
  | "skills"
  | "education"
  | "contact";

export interface NavItem extends Listable {
  label: string;
  /** In-page anchor (`#about`) or a route (`/projects/finsight`). */
  href: string;
}

export interface SiteConfig {
  /** Absolute URL of the deployed site. Used for canonical and OG tags. */
  url: string;
  /** Browser tab title and OG title. */
  title: string;
  /** Meta description and OG description. Aim for 150–160 characters. */
  description: string;
  keywords: string[];
  locale: string;
  /** Path under `public/` to the resume PDF. */
  resumePath: string;
  /** Filename the browser saves the resume as. */
  resumeDownloadName: string;
  /** Path under `public/` to the Open Graph image. */
  ogImage: string;
  /** Which sections appear, in order. Remove one and it disappears. */
  sections: SectionId[];
  nav: NavItem[];
  /**
   * Contact form configuration. The site ships without a form on purpose: a
   * form that silently discards messages is worse than no form at all. See the
   * README for how to wire a real one up.
   */
  contactForm: {
    enabled: false;
    note: string;
  };
  /** Shown in the footer. The year itself is always generated. */
  footerNote?: string;
}
