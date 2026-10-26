import type { Skill, SkillCategory } from "./types";

/**
 * Skills.
 *
 * Two lists: the categories, and the skills that belong to them. The filter
 * chips in the Skills section are built from `skillCategories` at render time,
 * so adding a category here makes a new filter appear — there is no second
 * place to update.
 *
 * ## Adding a skill
 *
 *   { id: "kafka", name: "Apache Kafka", category: "backend" }
 *
 * `id`, `name` and `category` are the only required fields. `category` must
 * match a `SkillCategory.id` below; if it does not, the build fails with a
 * message naming the offending skill rather than silently dropping it.
 *
 * ## Hiding and reordering
 *
 *   { id: "oauth2", name: "OAuth2", category: "security", hidden: true }
 *   { id: "java",   name: "Java",   category: "backend",  order: 1 }
 *
 * ## On `proficiency` and `usedInProduction`
 *
 * `proficiency` is free text, not a number. There are no percentage bars on
 * this site because an invented "Spring Boot — 92%" is indefensible the moment
 * someone asks about it.
 *
 * `usedInProduction: true` is set only where the resume's experience section
 * directly evidences production use. Everything else is left unmarked, which
 * claims nothing either way.
 */

export const skillCategories: SkillCategory[] = [
  {
    id: "backend",
    label: "Backend",
    description: "The core of the day job: services, APIs and the frameworks around them.",
    icon: "Server",
    order: 1,
  },
  {
    id: "databases",
    label: "Databases",
    description: "Relational storage, query tooling and schema migration.",
    icon: "Database",
    order: 2,
  },
  {
    id: "caching",
    label: "Caching",
    description: "Distributed and in-process caching for read-heavy, high-throughput paths.",
    icon: "Zap",
    order: 3,
  },
  {
    id: "security",
    label: "Security",
    description: "Authentication and authorisation for service-to-service and user traffic.",
    icon: "ShieldCheck",
    order: 4,
  },
  {
    id: "devops",
    label: "DevOps",
    description: "Packaging and running services.",
    icon: "Container",
    order: 5,
  },
  {
    id: "testing",
    label: "Testing",
    description: "Unit, slice and integration testing of Spring applications.",
    icon: "FlaskConical",
    order: 6,
  },
  {
    id: "tooling",
    label: "Monitoring & Tools",
    description: "Observability, code quality and the everyday workflow.",
    icon: "Activity",
    order: 7,
  },
];

export const skills: Skill[] = [
  /* ----- Backend ------------------------------------------------- */
  {
    id: "java",
    name: "Java",
    category: "backend",
    description: "Primary language since 2022.",
    usedInProduction: true,
    order: 1,
  },
  {
    id: "spring-boot",
    name: "Spring Boot",
    category: "backend",
    description: "Microservices handling consent and financial-information flows.",
    usedInProduction: true,
    order: 2,
  },
  {
    id: "rest-apis",
    name: "REST APIs",
    category: "backend",
    description: "Consent management and financial information exchange endpoints.",
    usedInProduction: true,
    order: 3,
  },
  {
    id: "microservices",
    name: "Microservices",
    category: "backend",
    description: "Independently deployed services behind a shared gateway.",
    usedInProduction: true,
    order: 4,
  },
  {
    id: "hibernate",
    name: "Hibernate",
    category: "backend",
    order: 5,
  },
  {
    id: "jpa",
    name: "JPA",
    category: "backend",
    order: 6,
  },
  {
    id: "spring-retry",
    name: "Spring Retry",
    category: "backend",
    description: "Bounded, backed-off retries against external providers.",
    usedInProduction: true,
    order: 7,
  },

  /* ----- Databases ------------------------------------------------ */
  {
    id: "postgresql",
    name: "PostgreSQL",
    category: "databases",
    description: "Primary datastore across professional and personal work.",
    usedInProduction: true,
    order: 1,
  },
  {
    id: "jooq",
    name: "jOOQ",
    category: "databases",
    description: "Type-safe SQL where the query matters more than the mapping.",
    usedInProduction: true,
    order: 2,
  },
  {
    id: "flyway",
    name: "Flyway",
    category: "databases",
    description: "Versioned migrations as the authoritative schema.",
    usedInProduction: true,
    order: 3,
  },

  /* ----- Caching -------------------------------------------------- */
  {
    id: "redis",
    name: "Redis",
    category: "caching",
    description: "Read-through caching and short-lived state.",
    usedInProduction: true,
    order: 1,
  },
  {
    id: "hazelcast",
    name: "Hazelcast",
    category: "caching",
    description: "Distributed cache shared across service replicas.",
    usedInProduction: true,
    order: 2,
  },
  {
    id: "spring-cache",
    name: "Spring Cache",
    category: "caching",
    description: "Declarative caching over the provider of the day.",
    usedInProduction: true,
    order: 3,
  },

  /* ----- Security -------------------------------------------------- */
  { id: "jwt", name: "JWT", category: "security", order: 1 },
  { id: "oauth2", name: "OAuth2", category: "security", order: 2 },

  /* ----- DevOps ---------------------------------------------------- */
  {
    id: "docker",
    name: "Docker",
    category: "devops",
    description: "Service images and local dependency stacks.",
    order: 1,
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    category: "devops",
    description: "Deployment and scaling of backend services.",
    order: 2,
  },

  /* ----- Testing --------------------------------------------------- */
  {
    id: "junit",
    name: "JUnit",
    category: "testing",
    usedInProduction: true,
    order: 1,
  },
  {
    id: "mockito",
    name: "Mockito",
    category: "testing",
    description: "Mocking external provider APIs so builds don't depend on them.",
    usedInProduction: true,
    order: 2,
  },
  {
    id: "spring-boot-test",
    name: "SpringBootTest",
    category: "testing",
    usedInProduction: true,
    order: 3,
  },
  {
    id: "mockmvc",
    name: "MockMvc",
    category: "testing",
    description: "Controller-layer tests without starting a server.",
    usedInProduction: true,
    order: 4,
  },

  /* ----- Monitoring & Tools ----------------------------------------- */
  {
    id: "elastic-apm",
    name: "Elastic APM",
    category: "tooling",
    description: "Distributed tracing used to shorten issue diagnosis.",
    usedInProduction: true,
    order: 1,
  },
  { id: "sonarqube", name: "SonarQube", category: "tooling", order: 2 },
  { id: "git", name: "Git", category: "tooling", order: 3 },
  { id: "bitbucket", name: "Bitbucket", category: "tooling", order: 4 },
  { id: "gitlab", name: "GitLab", category: "tooling", order: 5 },
  { id: "postman", name: "Postman", category: "tooling", order: 6 },
];
