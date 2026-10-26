import type { Profile } from "./types";

/**
 * Who you are. This is the only file that needs editing to change the name,
 * title, contact details or the hero and About copy.
 *
 * On years of experience: `careerStartDate` is the source of truth and the
 * displayed figure is derived from it, so it stays correct without anyone
 * remembering to update it. The `{{years}}` placeholder in `summary` is
 * substituted at render time. If you ever need the site to match a specific
 * resume wording instead, set `yearsOfExperienceOverride`.
 */
export const profile: Profile = {
  name: "Bhavesh Bokde",
  shortName: "Bhavesh",
  monogram: "BB",
  title: "Java Backend Engineer",
  tagline: "Spring Boot · REST APIs · Microservices",

  location: "Pune, Maharashtra, India",
  email: "bhaveshbokde@gmail.com",

  // Deliberately not set on the public site. A phone number on a public page
  // gets harvested by scrapers; this one is still in the resume PDF, so a
  // recruiter who actually downloads it has it, and a crawler does not.
  // Uncomment to show the phone row in the contact section again.
  // phone: "+91 8830076645",

  /**
   * The technologies called out in the hero, in order.
   *
   * Keep this short — it is a first impression, not the skills section. Every
   * entry should also exist in `src/data/skills.ts` so the two never disagree;
   * a test enforces that.
   */
  heroTechnologies: [
    "Java",
    "Spring Boot",
    "PostgreSQL",
    "Redis",
    "Apache Kafka",
  ],

  careerStartDate: "2022-09-01",
  // yearsOfExperienceOverride: "3.5+",   // uncomment to pin the figure

  summary:
    "Java backend developer with {{years}} years of experience designing scalable Spring Boot " +
    "microservices for India's RBI-regulated Account Aggregator ecosystem. I work on REST API " +
    "development, backend integrations, PostgreSQL, Redis, Spring Retry, secure financial data " +
    "exchange and production support — building backend systems that stay reliable under load " +
    "and are maintainable by the next person who opens them.",

  about: [
    "I build the backend services that move financial data safely between institutions. At " +
      "Lentra AI I work on AAConnect, an Account Aggregator platform in India's RBI-regulated " +
      "AA ecosystem, where a request is only correct if the consent behind it is valid, the " +
      "provider on the other end is reachable, and the failure path is as well-defined as the " +
      "happy one.",
    "Most of my work sits at integration boundaries — multiple Account Aggregators and " +
      "Financial Information Providers, each with their own timing, error vocabulary and " +
      "operational quirks. That has shaped how I write code: explicit error handling over " +
      "optimism, retries that are bounded and idempotent, logs that a person on call can " +
      "actually read, and tests that mock the outside world so a provider's bad afternoon " +
      "doesn't become a red build.",
  ],

  aboutExpanded: [
    "Away from the office codebase I build backend projects of my own, partly to try ideas " +
      "that a production system gives you no room to experiment with. FinSight tackles the " +
      "dual-write problem with a transactional outbox and two independent idempotency layers. " +
      "The e-commerce backend makes overselling structurally impossible with a single " +
      "conditional UPDATE rather than a Java lock that only protects one JVM. Each is written " +
      "to be read as much as run, with the trade-offs documented rather than hidden.",
    "I am most interested in the part of system design that only shows up in production: what " +
      "happens on the second attempt, what a partial failure leaves behind, and whether the " +
      "person debugging it at 2am has enough information to be sure. That is also where I " +
      "spend my study time — distributed systems patterns, PostgreSQL internals, and the " +
      "testing practices that make a refactor safe.",
  ],

  facts: [
    { label: "Based in", value: "Pune, India", order: 1 },
    { label: "Focus", value: "Backend · Fintech", note: "Account Aggregator ecosystem", order: 2 },
    { label: "Primary stack", value: "Java · Spring Boot", order: 3 },
    { label: "Currently", value: "Senior Associate Software Engineer", note: "Lentra AI", order: 4 },
  ],
};
