# Bhavesh Bokde — Portfolio

A personal portfolio for a Java backend engineer, built so the content lives in
data files and the components only render it. Adding a skill, a project or a
job is an edit to one file in `src/data/`; nothing in `src/components/` needs
to be opened.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Framer Motion · Vitest + React Testing Library · Playwright.

---

## Contents

- [Quick start](#quick-start)
- [Scripts](#scripts)
- [How the content architecture works](#how-the-content-architecture-works)
- [Editing your details](#editing-your-details)
- [Skills](#skills)
- [Projects](#projects)
- [Work experience](#work-experience)
- [Education](#education)
- [Social links and contact](#social-links-and-contact)
- [Section order and visibility](#section-order-and-visibility)
- [Replacing the resume](#replacing-the-resume)
- [Images and diagrams](#images-and-diagrams)
- [Testing](#testing)
- [Accessibility and motion](#accessibility-and-motion)
- [Deployment](#deployment)
- [Project layout](#project-layout)
- [Design notes](#design-notes)

---

## Quick start

Requires **Node 20.9+** (developed on Node 22).

```bash
npm ci                 # install exactly what the lockfile pins
npm run dev            # http://localhost:3000
```

Production:

```bash
npm run build
npm start              # http://localhost:3000
```

Run everything the CI would:

```bash
npm run check          # lint → typecheck → unit tests → production build
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (13 static pages) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint, flat config |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit and component tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run test:e2e:install` | Download the Chromium Playwright needs |
| `npm run check` | lint + typecheck + test + build |

Two helper scripts that are not part of the build:

```bash
./scripts/generate-images.sh         # regenerate public/og.png and the apple icon
node scripts/screenshots.mjs         # capture the site at every viewport size
```

---

## How the content architecture works

Everything the site says lives in `src/data/`:

| File | Holds |
|---|---|
| `src/data/types.ts` | The shape of every content type, documented inline |
| `src/data/profile.ts` | Name, title, contact details, hero and About copy |
| `src/data/site-config.ts` | Site URL, metadata, navigation, section order, resume path |
| `src/data/skills.ts` | Skill categories and skills |
| `src/data/experience.ts` | Work history |
| `src/data/projects.ts` | Projects and the long-form case study |
| `src/data/education.ts` | Education |
| `src/data/social-links.ts` | GitHub, LinkedIn, email and anything else |

Two conventions apply to **every list** in every one of those files:

```ts
{ hidden: true }    // removes it from the site without deleting it
{ order: 3 }        // sorts ascending; unordered entries follow ordered ones
```

Reading and sorting happens in `src/lib/content.ts`. Validation happens in
`src/lib/validate.ts`, which runs at build time — see below.

### Mistakes fail the build, loudly

`src/app/layout.tsx` calls `assertContentIsValid()`, so a broken data file stops
`next build` with a message naming the file and the entry rather than shipping a
silently missing card:

```
Portfolio content validation failed with 1 issue(s):
  1. [src/data/skills.ts] Skill "kafka" references category "nonexistent",
     which is not in skillCategories. Known categories: backend, databases, …
```

It checks the things that actually go wrong: duplicate ids and slugs, a skill
pointing at a category that does not exist, malformed dates, a role that ends
before it starts, an image without alt text, a professional project without a
confidentiality note, and a resume path that is not a public path.

**Optional fields being absent is never an error.** Every component is written
to render correctly without them, and there are tests that prove it.

---

## Editing your details

Everything personal is in **`src/data/profile.ts`**.

```ts
export const profile: Profile = {
  name: "Bhavesh Bokde",
  shortName: "Bhavesh",
  monogram: "BB",                 // the mark in the header and footer
  title: "Java Backend Engineer",
  tagline: "Spring Boot · REST APIs · Microservices",

  location: "Pune, Maharashtra, India",
  email: "bhaveshbokde@gmail.com",
  phone: "+91 8830076645",        // optional — delete the line to hide the row

  careerStartDate: "2022-09-01",
  summary: "Java backend developer with {{years}} years of experience …",
  about: ["First paragraph.", "Second paragraph."],
  aboutExpanded: ["Behind the Read more control."],   // optional
  facts: [{ label: "Based in", value: "Pune, India" }],
};
```

### Years of experience keep themselves current

The figure in the summary is **derived from `careerStartDate`**, not typed in.
`{{years}}` is replaced at render time with the number of years since that date,
rounded *down* to the nearest half year with a `+` appended — so September 2022
reads `4+` today and `4.5+` next March, with nobody having to remember.

To pin it instead (for example to match a resume already sent out):

```ts
yearsOfExperienceOverride: "3.5+",
```

The experience timeline works the same way: `formatDuration()` turns
`startDate: "2022-09"` with no `endDate` into `Sep 2022 – Present` and
`4 yrs 1 mo`, both recalculated on every build.

---

## Skills

**File:** `src/data/skills.ts`. Two lists — categories, and the skills in them.

The filter chips in the Skills section are **built from the data**: add a
category and a chip appears, hide every skill in a category and both the group
and its chip vanish. There is no list of categories in any component.

### Add a skill

```ts
{ id: "kafka", name: "Apache Kafka", category: "backend" }
```

`id`, `name` and `category` are the only required fields. `category` must match
a `SkillCategory.id`, or the build fails naming the offending skill.

With everything optional filled in:

```ts
{
  id: "kafka",
  name: "Apache Kafka",
  category: "backend",
  description: "Event streaming for the import pipeline.",
  proficiency: "Used on FinSight",      // free text — never a number
  usedInProduction: true,               // renders the small blue marker
  order: 8,
  hidden: false,
}
```

### Add a category

```ts
{
  id: "messaging",
  label: "Messaging",
  description: "Brokers and event streaming.",   // optional
  icon: "Network",                               // optional, see below
  order: 8,
}
```

### Hide, reorder, rename, remove

```ts
{ id: "oauth2", name: "OAuth2", category: "security", hidden: true }   // hide
{ id: "java",   name: "Java",   category: "backend",  order: 1 }       // move to front
{ id: "jpa",    name: "Jakarta Persistence", category: "backend" }     // rename
// remove: delete the object
```

### On ratings

There are no percentage bars, star ratings or expert/intermediate levels, and
`proficiency` is deliberately a string rather than a number. "Spring Boot — 92%"
is indefensible the moment an interviewer asks about it. `usedInProduction` is
set only where the resume's experience section directly evidences production
use; everything else is left unmarked, which claims nothing either way.

### Icons

`icon` accepts any name in the registry in `src/components/ui/Icon.tsx`, which
re-exports a hand-picked set from `lucide-react` plus custom `GitHub` and
`LinkedIn` marks. To use a new one, add it to the import and the map in that
file — two lines. An unknown name falls back to a neutral glyph rather than
crashing.

---

## Projects

**File:** `src/data/projects.ts`. Each project gets a card on the home page and
a static detail page at `/projects/<slug>`.

### Add a project

Minimum viable entry — everything else is optional:

```ts
{
  slug: "my-service",                 // becomes /projects/my-service
  name: "My Service",
  kind: "independent",                // "independent" | "professional"
  status: "in-development",           // complete | maintained | in-development | planned
  category: "Backend service",
  summary: "One sentence for the card.",
  stack: ["Java", "Spring Boot"],
  order: 9,
}
```

Fully populated:

```ts
{
  slug: "my-service",
  name: "My Service",
  kind: "independent",
  status: "complete",
  category: "Backend service",
  featured: false,
  accent: "cyan",                     // blue | violet | cyan | amber | emerald
  summary: "One sentence for the card.",
  problem: "What this solves, and why it is not trivial.",
  features: ["Feature one.", "Feature two."],
  stack: ["Java 21", "Spring Boot 3.5", "PostgreSQL 16"],
  architecture: ["A paragraph on the design.", "Another one."],
  implementation: ["A notable implementation detail."],
  testing: ["What is actually tested, and how."],
  metrics: [
    { label: "Tests", value: "336 passing", source: "unit + integration" },
  ],
  links: [
    { label: "Repository", url: "https://github.com/you/repo", kind: "repository" },
    { label: "Live demo",  url: "https://demo.example.com",    kind: "demo" },
  ],
  preview: "/projects/my-service.svg",
  previewAlt: "Diagram of the request pipeline.",   // required when preview is set
  caseStudy: [
    { id: "context", heading: "Business context", body: ["…"] },
    { id: "role",    heading: "My role",          bullets: ["…"] },
  ],
  lessons: ["What you would do differently."],
}
```

### Hide, reorder, remove

```ts
{ …, hidden: true }     // off the site, still in the file
{ …, order: 2 }         // position in the grid
// remove: delete the object — the detail page and sitemap entry go with it
```

### Links that do not exist yet

Omit `url` and the UI renders a **"link not configured"** affordance instead of
a dead anchor — obvious to you while drafting, harmless to a visitor:

```ts
links: [{ label: "Repository", kind: "repository" }]   // no url yet
```

### Professional vs independent

`kind: "professional"` is employer-owned work. It is **described, never
published**: no source, no internal URLs, no proprietary architecture. The
validator *requires* a `confidentialityNote` on any professional project, so one
cannot be added without saying what is and is not shown:

```ts
{
  kind: "professional",
  confidentialityNote:
    "This is a professional project owned by <employer>. Nothing on this page " +
    "is proprietary: no source code, no internal endpoints, no customer data.",
}
```

The professional project also gets its own featured section on the home page —
whichever project is `kind: "professional"` **and** `featured: true`. It is
excluded from the independent-projects grid so it does not appear twice.

### On the numbers

Every value in `metrics` should carry a `source`, and a test enforces it. Each
figure currently on the site comes from the project's own tooling — JaCoCo for
coverage, Maven Surefire for test counts. There are no invented throughput,
latency, user-count or revenue numbers anywhere.

---

## Work experience

**File:** `src/data/experience.ts`.

```ts
{
  id: "acme-2027",
  role: "Senior Software Engineer",
  company: "Acme",
  companyUrl: "https://acme.example",     // optional
  location: "Remote",                     // optional
  employmentType: "Full-time",            // optional
  startDate: "2027-01",                   // YYYY-MM or YYYY-MM-DD
  // endDate: "2028-06",                  // OMIT while the role is current
  summary: "A paragraph framing the work.",   // optional
  highlights: [
    { text: "What you did." },
    { text: "A figure from your resume.", resumeReported: true },
  ],
  stack: ["Java", "Spring Boot"],         // optional
  order: 0,                               // lower appears first
}
```

**Dates are never hand-written.** Omitting `endDate` means the role is current:
the timeline renders "Present" and the duration keeps counting on its own.

**`resumeReported: true`** makes the UI label that claim as coming from the
resume rather than from something measured for this site. It is used for the
~30% diagnosis-time figure — a real reported outcome of the work, but not a
benchmark anyone re-ran, and the page should not let anyone confuse the two.

---

## Education

**File:** `src/data/education.ts`.

```ts
{
  id: "be-cse-rtmnu",
  degree: "Bachelor of Engineering",
  field: "Computer Science & Engineering",      // optional
  institution: "Govindrao Wanjari College of Engineering & Technology",
  affiliation: "RTMNU",                          // optional
  location: "Nagpur, India",                     // optional
  startYear: "2013",
  endYear: "2017",
  details: ["Anything else worth adding."],      // optional
}
```

No grade, percentage, class or honour is displayed unless you put it in
`details` yourself.

---

## Social links and contact

**File:** `src/data/social-links.ts`.

```ts
{
  id: "stackoverflow",
  label: "Stack Overflow",
  url: "https://stackoverflow.com/users/0000000",   // omit if not created yet
  icon: "MessageSquareCode",
  handle: "bhavesh",          // optional
  showInHero: false,          // the icon row under the hero
  showInFooter: true,         // defaults to true
  order: 4,
}
```

A link with no `url` renders as a disabled "not configured" chip rather than a
dead anchor.

Contact details come from `profile.ts` (`email`, `phone`, `location`). Deleting
`phone` removes the phone row everywhere.

### Why there is no contact form

A form on a statically hosted site needs a backend or a third-party endpoint.
Without one it is a box that eats messages while looking like it worked, which
is worse than no form at all. `siteConfig.contactForm.enabled` is typed as
`false` on purpose.

If you want one, the two honest options are:

1. **A hosted service** — Formspree, Web3Forms, Basin. Point a `<form action>`
   at their endpoint. The form ID is public by design; no secret is involved.
2. **A Next route handler** — `src/app/api/contact/route.ts`, with server-side
   validation, a rate limit, and a spam check (a honeypot field plus a Turnstile
   or hCaptcha token). The provider's **secret key must stay server-side**, read
   from `process.env` and never prefixed `NEXT_PUBLIC_`. This also means the site
   can no longer be a pure static export.

Either way, send yourself a real message through it before you believe it works.

---

## Section order and visibility

**File:** `src/data/site-config.ts`.

```ts
sections: [
  "hero", "about", "experience", "case-study",
  "projects", "skills", "education", "contact",
],
```

`src/app/page.tsx` walks this array and renders the matching component, so the
page order follows the config. Remove an id and the section stops rendering.
Remove the matching `nav` entry and its link disappears too.

```ts
nav: [
  { label: "About",      href: "#about",      order: 1 },
  { label: "Experience", href: "#experience", order: 2 },
  { label: "Writing",    href: "/writing",    order: 6 },   // routes work too
],
```

---

## Replacing the resume

1. Drop the PDF in `public/resume/`.
2. Point `siteConfig.resumePath` and `resumeDownloadName` at it:

```ts
resumePath: "/resume/Bhavesh-Bokde-Java-Backend-Engineer.pdf",
resumeDownloadName: "Bhavesh-Bokde-Java-Backend-Engineer.pdf",
```

Every "Download resume" control on the site reads those two values — the header,
the hero, the footer and the contact panel.

Verify it:

```bash
npm run build && npm start
curl -sI http://localhost:3000/resume/<your-file>.pdf | head -3
```

There is also an end-to-end test that fetches the PDF, checks the `%PDF` magic
bytes, and clicks the download button to confirm the filename.

> **The resume contains a personal phone number, email address and employment
> history.** It is in this repository because the repository is private. Read
> the [public-release checklist](#before-making-this-public) before changing
> that.

---

## Images and diagrams

No stock photography is used anywhere. Each project preview is a hand-authored
SVG in `public/projects/` showing that project's actual architecture — the
outbox pipeline, the conditional UPDATE, the notification fan-out. They double
as the detail-page diagrams.

To add one: put the SVG in `public/projects/`, then set `preview` and
`previewAlt` on the project. If you leave `preview` off, the card renders a
typographic panel rather than a hole.

Two raster assets are generated and committed:

```bash
./scripts/generate-images.sh    # public/og.png (1200×630), src/app/apple-icon.png
```

They are rendered from the HTML in `scripts/og/` with headless Chrome, using the
same fonts the site ships. They are committed rather than built because they
change about once a year, and generating them on every build would make
`next build` depend on a browser being installed.

The favicon is `src/app/icon.svg` — edit it directly.

### Fonts

Inter, Space Grotesk and JetBrains Mono are **self-hosted** from
`src/app/fonts/` (latin subset, ~102 KB total). That means `next build` needs no
network access and a visitor's browser makes no third-party request. Licences
and swap instructions: [`src/app/fonts/README.md`](src/app/fonts/README.md).

---

## Testing

```bash
npm test               # Vitest: unit + component
npm run test:e2e       # Playwright: full flows against the production build
```

Playwright needs its browser once per machine:

```bash
npm run test:e2e:install
```

The Playwright config builds the app and starts it on port 3100 itself, so
`npm run test:e2e` works from a clean checkout with no server running.

**What the unit tests cover:** the sort/hide rules, every date and duration
helper, the derived years-of-experience figure, each validation rule (including
that the real content passes), the project card with *only* its required fields,
the skills filter deriving its chips from data, the mobile menu's focus trap and
Escape handling, and that no section renders a fabricated statistic.

**What the end-to-end tests cover:** every section rendering, zero console
errors, no broken internal links, no missing images, every image having alt
text, in-page anchors resolving, the mobile menu, the resume actually
downloading a real PDF, external links carrying `noopener noreferrer`, all six
project pages, the 404, `robots.txt` and `sitemap.xml`, reduced-motion
behaviour, and no horizontal overflow at 375 / 768 / 1280 / 1920 px.

---

## Accessibility and motion

- Semantic landmarks, one `h1` per page, ordered headings.
- A skip link as the first item in the tab order.
- Visible focus rings everywhere (`:focus-visible`, never removed).
- The mobile menu traps Tab, closes on Escape, returns focus to its toggle, and
  locks body scroll while open.
- Every image has alt text; decorative layers are `aria-hidden`.
- External links announce "opens in a new tab".

**Reduced motion is honoured in two places, deliberately.** CSS cancels
animations and turns off smooth scrolling; `usePrefersReducedMotion` (built on
`useSyncExternalStore`, so it also reacts to the preference changing mid-session)
stops Framer Motion from starting an animation at all. Purely decorative layers
are marked `data-motion="decorative"` and removed outright rather than frozen
mid-animation.

The important part: with reduced motion the reveal wrappers render their
children *directly*, with no initial opacity. Content hidden behind a cancelled
animation is a bug, not an accessibility feature.

---

## Deployment

> Deploy only after the [public-release checklist](#before-making-this-public).

**Set the site URL first.** `siteConfig.url` feeds the canonical tag, the
sitemap and the Open Graph tags, and it currently falls back to a placeholder.
Either edit the fallback in `src/data/site-config.ts` or set the environment
variable, which takes precedence:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

**Vercel** — import the repository; the framework is detected, no build
configuration needed. Add `NEXT_PUBLIC_SITE_URL` under Settings → Environment
Variables.

**Netlify / Cloudflare Pages** — build `npm run build`, with the respective
Next.js adapter.

**A static host (GitHub Pages, S3, nginx).** The site has no server-side logic,
so it exports cleanly. Add to `next.config.ts`:

```ts
output: "export",
images: { unoptimized: true },
```

then `npm run build` writes `out/`. Note that `output: "export"` drops the
`headers()` block — those security headers have to move to the host's own
configuration. If you add a contact route handler later, static export is no
longer an option.

### Before making this public

A private repository and a public website are different things. Work through
this before flipping either:

- [ ] **Contact details.** `profile.ts` carries a personal email, a phone number
      and a city. The phone number in particular will be scraped. Remove it
      (delete the `phone` line) or accept that.
- [ ] **The resume PDF.** `public/resume/` is served to anyone who asks. It
      contains the same phone number and email, plus full employment history.
      Decide whether to publish it as-is, publish a version with contact details
      stripped, or gate it behind an email request.
- [ ] **Office-project confidentiality.** Re-read the AAConnect case study and
      the diagram in `public/projects/aaconnect-architecture.svg` with fresh
      eyes. It is written to name nothing internal — no endpoints, no service
      names, no topology, no security controls, no customer or consent data —
      but you know your employer's policy better than this file does. If your
      contract requires it, get sign-off.
- [ ] **Employer policy.** Some contracts restrict publicly describing project
      work at all. Check yours.
- [ ] **`siteConfig.url`.** Replace the placeholder or the OG previews break.
- [ ] **Links.** Confirm the GitHub and LinkedIn URLs resolve, and that every
      repository you link is itself public — a 404 on a portfolio link is worse
      than no link.
- [ ] **Repository contents.** `git ls-files` and read the list. No `.env`, no
      private notes, no employer material.
- [ ] **Figures.** Every number on the site should be one you can defend in an
      interview.

---

## Project layout

```
06-developer-portfolio/
├── e2e/                        Playwright specs
├── public/
│   ├── og.png                  generated social card
│   ├── projects/*.svg          hand-authored project diagrams
│   └── resume/*.pdf            the resume that is served
├── scripts/
│   ├── generate-images.sh      regenerates og.png and apple-icon.png
│   ├── og/                     HTML sources for those two images
│   └── screenshots.mjs         visual check at every viewport
└── src/
    ├── app/
    │   ├── fonts/              self-hosted woff2 + licence
    │   ├── projects/[slug]/    static detail page per project
    │   ├── globals.css         design tokens, utilities, reduced motion
    │   ├── icon.svg            favicon
    │   ├── layout.tsx          fonts, metadata, validation, chrome
    │   ├── not-found.tsx       custom 404
    │   ├── page.tsx            renders siteConfig.sections in order
    │   ├── robots.ts
    │   └── sitemap.ts          generated from the project data
    ├── components/
    │   ├── layout/             Header (+ mobile menu), Footer
    │   ├── sections/           one component per page section
    │   ├── ui/                 Button, Tag, Icon, ProjectCard, …
    │   └── visuals/            Aurora backdrop, hero diagram
    ├── data/                   ← all content lives here
    ├── hooks/
    └── lib/                    selectors, validation, utilities
```

---

## Design notes

A few decisions worth knowing before changing things.

**The backdrop is CSS, not WebGL.** The aurora is three blurred radial
gradients and a masked CSS grid. No canvas, no Three.js, no particle library,
nothing to download. It costs nothing on a low-powered phone and degrades to a
flat dark background wherever it is not supported.

**The hero diagram is inline SVG.** A few kilobytes of markup that ships in the
HTML. Its motion is `stroke-dashoffset` and two slowly rotating ellipses — no
per-frame JavaScript, nothing recalculating layout.

**Most of the page is server-rendered.** Only the header, the skills filter, the
About disclosure, the hero diagram and the reveal wrapper are client components.
The derived years-of-experience figure is rendered on the server specifically so
it cannot differ between server and client at a month boundary.

**Colour is rationed.** Graphite and near-black carry the page; azure and violet
appear on one filled button, the section eyebrows and a few hairlines. That
scarcity is what makes the glow read as lighting rather than decoration.

**Dates are computed, never typed.** Every date string in `src/data/` is ISO and
every displayed form is derived from it, because "Sep 2022 – Present" written by
hand is correct exactly once.

---

## Licence

The code is MIT — see [LICENSE](LICENSE). The **content** is not: the résumé,
the written copy, the project case studies and the personal details belong to
Bhavesh Bokde. Fork the structure, bring your own story.
