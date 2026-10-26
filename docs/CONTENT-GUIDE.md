# Content editing guide

A cookbook. Every entry is a complete, copy-pasteable block — find the task,
copy the snippet, change the words.

The rule the whole project follows: **components render data, they never
contain data.** Nothing in this guide asks you to open a file in
`src/components/`.

After any edit:

```bash
npm run dev        # see it
npm run check      # lint + typecheck + tests + build
```

If you get something wrong, the build stops and tells you which file and which
entry. That is the design, not an inconvenience.

---

## Contents

1. [Change your name, title or contact details](#1-change-your-name-title-or-contact-details)
2. [Change the hero and About copy](#2-change-the-hero-and-about-copy)
3. [Add a skill](#3-add-a-skill)
4. [Add a skill category](#4-add-a-skill-category)
5. [Hide, reorder, rename or remove a skill](#5-hide-reorder-rename-or-remove-a-skill)
6. [Add a project](#6-add-a-project)
7. [Add a full case study to a project](#7-add-a-full-case-study-to-a-project)
8. [Hide, reorder or remove a project](#8-hide-reorder-or-remove-a-project)
9. [Add or update a job](#9-add-or-update-a-job)
10. [Mark a job as finished](#10-mark-a-job-as-finished)
11. [Add an education entry](#11-add-an-education-entry)
12. [Add a social link](#12-add-a-social-link)
13. [Replace the resume](#13-replace-the-resume)
14. [Turn a section off, or reorder sections](#14-turn-a-section-off-or-reorder-sections)
15. [Change the site URL and metadata](#15-change-the-site-url-and-metadata)
16. [Add a project diagram](#16-add-a-project-diagram)
17. [Use a new icon](#17-use-a-new-icon)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Change your name, title or contact details

**File:** `src/data/profile.ts`

```ts
export const profile: Profile = {
  name: "Bhavesh Bokde",
  shortName: "Bhavesh",
  monogram: "BB",
  title: "Java Backend Engineer",
  tagline: "Spring Boot · REST APIs · Microservices",

  location: "Pune, Maharashtra, India",
  email: "bhaveshbokde@gmail.com",
  phone: "+91 8830076645",
  // …
};
```

**To remove the phone number entirely** — delete the line. The phone row
disappears from the contact section and nothing breaks.

---

## 2. Change the hero and About copy

**File:** `src/data/profile.ts`

```ts
  // One paragraph, shown in the hero. {{years}} is filled in automatically.
  summary:
    "Java backend developer with {{years}} years of experience designing " +
    "scalable Spring Boot microservices …",

  // The About section. Each string is its own paragraph.
  about: [
    "First paragraph — always visible.",
    "Second paragraph — always visible.",
  ],

  // Optional. Shown behind a "Read more" control.
  // Delete the whole key and no expand control is rendered.
  aboutExpanded: [
    "Third paragraph — behind the toggle.",
  ],

  // Optional. The small table beside the About copy.
  facts: [
    { label: "Based in", value: "Pune, India", order: 1 },
    { label: "Focus", value: "Backend · Fintech", note: "AA ecosystem", order: 2 },
  ],
```

### Years of experience

`{{years}}` is derived from `careerStartDate`, rounded **down** to the nearest
half year with a `+`. You never edit the number.

```ts
  careerStartDate: "2022-09-01",     // → "4+" today, "4.5+" next March
```

To pin it to a fixed string instead:

```ts
  yearsOfExperienceOverride: "3.5+",
```

---

## 3. Add a skill

**File:** `src/data/skills.ts` → the `skills` array.

Minimum:

```ts
{ id: "kafka", name: "Apache Kafka", category: "backend" },
```

With everything optional:

```ts
{
  id: "kafka",
  name: "Apache Kafka",
  category: "backend",                  // must match a SkillCategory.id
  description: "Event streaming for the import pipeline.",
  proficiency: "Used on FinSight",      // free text, never a number
  usedInProduction: true,               // small blue marker + legend
  order: 8,
  hidden: false,
},
```

> **Never invent a rating.** `proficiency` is a string on purpose. Set
> `usedInProduction` only where you genuinely ship it at work — an absent
> marker claims nothing, which is the honest default.

---

## 4. Add a skill category

**File:** `src/data/skills.ts` → the `skillCategories` array.

```ts
{
  id: "messaging",
  label: "Messaging",
  description: "Brokers and event streaming.",   // optional
  icon: "Network",                               // optional
  order: 8,
},
```

A new filter chip appears automatically with the right count. Then point skills
at it with `category: "messaging"`.

A category whose skills are all hidden disappears along with its chip — you do
not need to remove it by hand.

---

## 5. Hide, reorder, rename or remove a skill

```ts
// Hide it, keep the entry
{ id: "oauth2", name: "OAuth2", category: "security", hidden: true },

// Move it to the front of its category
{ id: "java", name: "Java", category: "backend", order: 1 },

// Rename it
{ id: "jpa", name: "Jakarta Persistence", category: "backend" },

// Move it to a different category
{ id: "redis", name: "Redis", category: "databases" },

// Remove it — delete the object
```

`order` sorts ascending. Entries without an `order` keep their position in the
file and follow the ordered ones, so you only number what you care about.

---

## 6. Add a project

**File:** `src/data/projects.ts`

Minimum — only these seven fields are required:

```ts
{
  slug: "my-service",            // becomes /projects/my-service
  name: "My Service",
  kind: "independent",           // "independent" | "professional"
  status: "in-development",      // complete | maintained | in-development | planned
  category: "Backend service",
  summary: "One sentence for the card.",
  stack: ["Java", "Spring Boot"],
},
```

Everything else is optional, and the detail page simply omits any block you
leave out.

Fully populated:

```ts
{
  slug: "my-service",
  name: "My Service",
  kind: "independent",
  status: "complete",
  category: "Backend service",
  featured: false,
  accent: "cyan",                // blue | violet | cyan | amber | emerald
  summary: "One sentence for the card.",

  problem: "What this solves, and why it is not trivial.",
  features: ["Feature one.", "Feature two."],
  stack: ["Java 21", "Spring Boot 3.5", "PostgreSQL 16"],
  architecture: ["A paragraph about the design.", "Another one."],
  implementation: ["A notable implementation detail."],
  testing: ["What is actually tested, and how."],

  metrics: [
    { label: "Tests", value: "336 passing", source: "179 unit + 157 integration" },
    { label: "Line coverage", value: "80.9%", source: "measured by JaCoCo" },
  ],

  links: [
    { label: "Repository", url: "https://github.com/you/repo", kind: "repository" },
    { label: "Live demo",  url: "https://demo.example.com",    kind: "demo" },
  ],

  preview: "/projects/my-service.svg",
  previewAlt: "Diagram of the request pipeline.",   // required if preview is set

  lessons: ["What you would do differently."],
  order: 9,
},
```

### No URL yet?

Omit `url`. The UI renders "link not configured" rather than a dead anchor:

```ts
links: [{ label: "Repository", kind: "repository" }],
```

### Every metric needs a source

```ts
{ label: "Tests", value: "336 passing", source: "measured by Maven Surefire" }
```

A test enforces this. Do not add a number you cannot attribute — and never add
throughput, latency, user counts or revenue figures you have not measured.

### Status vocabulary — say what is true

| Status | Means |
|---|---|
| `complete` | Feature-complete, tests passing |
| `maintained` | Actively worked on and kept current |
| `in-development` | Work in progress — not finished, not deployed |
| `planned` | Scoped but not started |

Only add a `kind: "demo"` link when there is a URL that actually answers.

### Employer work

```ts
{
  slug: "internal-platform",
  name: "Internal Platform",
  kind: "professional",
  status: "maintained",
  category: "Payments platform · Employer",
  summary: "One sentence at the level of publicly known facts.",
  stack: ["Java", "Spring Boot"],

  // REQUIRED for kind: "professional" — the build fails without it.
  confidentialityNote:
    "This is a professional project owned by <employer>, and I am one engineer " +
    "on the team that builds it. Nothing on this page is proprietary: there is " +
    "no source code, no internal endpoint, no repository link and no customer " +
    "data. Where a detail is internal, it is left out rather than blurred.",

  featured: true,     // promotes it to the home page's case-study section
},
```

**The rules for professional work, in full:**

- No source code, internal repository URLs, API endpoints, credentials, tokens,
  customer data, real payloads, production logs or confidential diagrams.
- No sensitive internal architecture or security controls.
- Describe your contributions to a team and a platform. Do not imply you built
  it alone.
- Diagrams use generic component roles and synthetic values only.
- If a detail is uncertain or confidential, **leave it out**. Do not approximate
  it.

---

## 7. Add a full case study to a project

```ts
  caseStudy: [
    {
      id: "context",                    // used by the on-this-page nav
      heading: "Business context",
      body: ["A paragraph.", "Another paragraph."],
    },
    {
      id: "role",
      heading: "My role and contributions",
      body: ["Optional framing paragraph."],
      bullets: ["A specific contribution.", "Another one."],
    },
  ],
```

Each section needs `body`, `bullets`, or both — a section with neither fails the
build. Sections render in array order, and the sidebar table of contents is
generated from them.

The home page's featured case-study section looks for sections with the ids
`context` and `role` to build its teaser. Other ids are fine; they just appear
on the detail page only.

---

## 8. Hide, reorder or remove a project

```ts
// Hide from the site, keep the entry
{ …, hidden: true },

// Position in the grid
{ …, order: 2 },

// Promote to the featured slot
{ …, featured: true },

// Remove — delete the object. The detail page and sitemap entry go with it.
```

> A hidden project is still reachable at its URL if you type it directly, which
> is deliberate: it lets you draft a detail page before listing it.

---

## 9. Add or update a job

**File:** `src/data/experience.ts`

```ts
{
  id: "acme-2027",
  role: "Senior Software Engineer",
  company: "Acme",
  companyUrl: "https://acme.example",     // optional
  location: "Remote",                     // optional
  employmentType: "Full-time",            // optional
  startDate: "2027-01",                   // YYYY-MM or YYYY-MM-DD
  // endDate omitted — this role is current

  summary: "A paragraph framing the work.",   // optional

  highlights: [
    { text: "What you did." },
    { text: "A figure quoted from your resume.", resumeReported: true },
  ],

  stack: ["Java", "Spring Boot", "PostgreSQL"],   // optional
  order: 0,                                       // lower appears first
},
```

**Never write "Sep 2022 – Present" or "4 yrs 1 mo" by hand.** Both are computed
from `startDate` and `endDate`, so they cannot go stale.

### `resumeReported`

Set it on any claim that comes from your resume rather than from something
measured for this site. The UI then renders a small "resume-reported" marker
with an explanatory tooltip:

```ts
{
  text: "Improved observability using Elastic APM, reducing issue diagnosis " +
        "time by approximately 30%.",
  resumeReported: true,
},
```

This is the honest way to carry a figure you believe but did not re-measure.

---

## 10. Mark a job as finished

Add `endDate`. The timeline stops saying "Present", the duration freezes, and
the pulsing "current role" dot turns off.

```ts
  startDate: "2022-09",
  endDate: "2027-03",
```

---

## 11. Add an education entry

**File:** `src/data/education.ts`

```ts
{
  id: "mtech-2029",
  degree: "Master of Technology",
  field: "Computer Science",                  // optional
  institution: "Example Institute",
  affiliation: "Example University",          // optional
  location: "Pune, India",                    // optional
  startYear: "2027",
  endYear: "2029",
  details: ["Thesis: something specific."],   // optional
  order: 0,
},
```

No grade or percentage is ever displayed unless you put it in `details`.

---

## 12. Add a social link

**File:** `src/data/social-links.ts`

```ts
{
  id: "stackoverflow",
  label: "Stack Overflow",
  url: "https://stackoverflow.com/users/0000000",
  icon: "MessageSquareCode",
  handle: "bhavesh",          // optional
  showInHero: false,          // the icon row under the hero
  showInFooter: true,         // defaults to true
  order: 4,
},
```

**Not created yet?** Omit `url` — it renders as a disabled "not configured" chip
instead of a dead link:

```ts
{ id: "blog", label: "Blog", icon: "FileText", showInFooter: true },
```

---

## 13. Replace the resume

1. Put the PDF in `public/resume/`.
2. Update two lines in `src/data/site-config.ts`:

```ts
  resumePath: "/resume/Bhavesh-Bokde-Java-Backend-Engineer.pdf",
  resumeDownloadName: "Bhavesh-Bokde-Java-Backend-Engineer.pdf",
```

3. Verify it actually serves:

```bash
npm run build && npm start
curl -sI http://localhost:3000/resume/<your-file>.pdf | head -3
```

Every download control on the site — header, hero, footer, contact panel —
reads those two values.

---

## 14. Turn a section off, or reorder sections

**File:** `src/data/site-config.ts`

```ts
  sections: [
    "hero", "about", "experience", "case-study",
    "projects", "skills", "education", "contact",
  ],
```

Remove an id to drop that section. Move an id to reorder the page — the home
page walks this array, so the order here *is* the page order.

Then remove or reorder the matching nav link:

```ts
  nav: [
    { label: "About",      href: "#about",      order: 1 },
    { label: "Experience", href: "#experience", order: 2 },
    { label: "Skills",     href: "#skills",     order: 3 },
    { label: "Projects",   href: "#projects",   order: 4 },
    { label: "Contact",    href: "#contact",    order: 5 },
  ],
```

`href` takes an in-page anchor (`#about`) or a route (`/writing`).

---

## 15. Change the site URL and metadata

**File:** `src/data/site-config.ts`

```ts
const FALLBACK_SITE_URL = "https://your-domain.example";   // ⚠️ currently a placeholder

export const siteConfig: SiteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_SITE_URL,
  title: "Bhavesh Bokde — Java Backend Engineer",
  description: "…aim for 150–160 characters…",
  keywords: ["Bhavesh Bokde", "Java Backend Engineer", "Spring Boot"],
  // …
};
```

`url` feeds the canonical tag, the sitemap and the Open Graph tags. **Set it
before deploying** or social previews break. The environment variable wins over
the fallback, so you can leave the file alone and set it on the host.

---

## 16. Add a project diagram

1. Author an SVG at `1000×625` (16:10 — the card's aspect, so nothing is
   cropped). Copy one in `public/projects/` as a starting point; they share a
   palette.
2. Save it to `public/projects/my-service.svg`.
3. Reference it:

```ts
  preview: "/projects/my-service.svg",
  previewAlt: "What the diagram shows, described for someone who cannot see it.",
```

`previewAlt` is **required** whenever `preview` is set — the build fails
otherwise.

No `preview`? The card falls back to a typographic panel. That is fine; a
missing diagram is better than an unrelated stock photo presented as a
screenshot of your software.

For employer work, keep diagrams generic: component roles, not service names;
synthetic values, not real ones.

---

## 17. Use a new icon

**File:** `src/components/ui/Icon.tsx` — the one component file this guide sends
you to.

```ts
// 1. add it to the import from lucide-react
import { Network, /* … */ } from "lucide-react";

// 2. add it to the ICONS map
const ICONS: Record<string, IconComponent> = {
  Network,
  // …
};
```

Then use `icon: "Network"` in any data file.

Icons are listed explicitly rather than imported wholesale so the bundle only
carries the thirty or so actually used, not all 1,500. An unrecognised name
falls back to a neutral glyph rather than crashing.

---

## 18. Troubleshooting

### The build failed with "content validation failed"

Working as intended — read the message:

```
Portfolio content validation failed with 1 issue(s):
  1. [src/data/skills.ts] Skill "kafka" references category "nonexistent",
     which is not in skillCategories. Known categories: backend, databases, …
```

It names the file, the entry and usually the valid options.

### A skill or project is not showing up

1. `hidden: true`?
2. For a skill: does `category` exactly match a `SkillCategory.id`?
3. For a project: is `kind` right? The featured professional project renders in
   the case-study section and is *excluded* from the projects grid, so it does
   not appear twice.
4. Is the section still listed in `siteConfig.sections`?

### Two projects collided

Slugs are URLs and must be unique, lowercase and kebab-case. The validator says
which one clashed.

### The dates look wrong

`startDate` and `endDate` must be `YYYY-MM` or `YYYY-MM-DD`. `"Sep 2022"` fails
validation. To mark a role as current, **omit `endDate`** — do not set it to a
future date or to an empty string.

### The years-of-experience number looks wrong

It is derived from `profile.careerStartDate` and rounds **down** to the nearest
half year. Four years and eleven months reads `4.5+`, not `5+`. That is
deliberate — it will never overstate. Use `yearsOfExperienceOverride` to pin it.

### The site looks blank below the hero in a screenshot

A screenshotting artefact, not a bug. Sections reveal on scroll via
IntersectionObserver, and a one-shot screenshot never scrolls. Use
`node scripts/screenshots.mjs`, which scrolls a viewport at a time, or just look
at it in a browser.
