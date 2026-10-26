import type { SiteConfig } from "./types";

/**
 * Site-wide configuration: metadata, navigation, which sections render, and
 * where the resume lives.
 *
 * ## Before you publish
 *
 * `url` must be the real deployed origin. It is what canonical links, the
 * sitemap and the Open Graph tags are built from, so a placeholder here means
 * broken social previews. Either edit the fallback below or set
 * `NEXT_PUBLIC_SITE_URL` in the deployment environment — the environment
 * variable wins.
 *
 * ## Turning sections off
 *
 * Remove an id from `sections` and that section stops rendering. Remove the
 * matching entry from `nav` as well and its link disappears too. Nothing else
 * needs touching.
 */

/** ⚠️ Placeholder. Replace with the real origin before going public. */
const FALLBACK_SITE_URL = "https://bhavesh-bokde-portfolio.vercel.app";

export const siteConfig: SiteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_SITE_URL,

  title: "Bhavesh Bokde — Java Backend Engineer",
  description:
    "Java backend engineer in Pune building Spring Boot microservices for India's " +
    "Account Aggregator ecosystem — REST APIs, consent and financial data exchange, " +
    "PostgreSQL, Redis and production reliability.",
  keywords: [
    "Bhavesh Bokde",
    "Java Backend Engineer",
    "Spring Boot",
    "Microservices",
    "REST API",
    "Account Aggregator",
    "Fintech Backend",
    "PostgreSQL",
    "Redis",
    "Hazelcast",
    "Pune",
  ],
  locale: "en_IN",

  resumePath: "/resume/Bhavesh-Bokde-Java-Backend-Engineer.pdf",
  resumeDownloadName: "Bhavesh-Bokde-Java-Backend-Engineer.pdf",
  ogImage: "/og.png",

  sections: [
    "hero",
    "about",
    "experience",
    "case-study",
    "projects",
    "skills",
    "education",
    "contact",
  ],

  nav: [
    { label: "About", href: "#about", order: 1 },
    { label: "Experience", href: "#experience", order: 2 },
    { label: "Skills", href: "#skills", order: 3 },
    { label: "Projects", href: "#projects", order: 4 },
    { label: "Contact", href: "#contact", order: 5 },
  ],

  // No contact form ships with this site. A form that posts nowhere is worse
  // than no form: it looks like it worked and quietly loses the message. The
  // README documents how to add a real one (a provider such as Formspree or a
  // Next route handler with server-side validation and a spam check) if you
  // ever want one. No API key belongs in this repository either way.
  contactForm: {
    enabled: false,
    note: "Email and LinkedIn are the fastest routes — both reach me directly.",
  },

  footerNote: "Built with Next.js, TypeScript and Tailwind CSS.",
};
