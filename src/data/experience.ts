import type { Experience } from "./types";

/**
 * Work history.
 *
 * Dates are ISO strings and the UI formats them, so you never hand-write
 * "Sep 2022 – Present" anywhere. Omitting `endDate` means the role is current:
 * the timeline renders "Present" and the duration keeps counting on its own.
 *
 * ## Adding a role
 *
 *   {
 *     id: "acme-2027",
 *     role: "Senior Software Engineer",
 *     company: "Acme",
 *     location: "Remote",
 *     startDate: "2027-01",
 *     // endDate: "2028-06",          // omit while current
 *     highlights: [{ text: "What you did." }],
 *     stack: ["Java", "Spring Boot"],
 *     order: 0,                        // lower numbers appear first
 *   }
 *
 * ## On `resumeReported`
 *
 * Setting `resumeReported: true` on a highlight makes the UI label the claim as
 * coming from the resume rather than from something measured on this site. It
 * is used for the ~30% diagnosis-time figure below, which is a reported
 * improvement from the work — not a benchmark anyone re-ran for this portfolio.
 */
export const experience: Experience[] = [
  {
    id: "lentra-sase",
    role: "Senior Associate Software Engineer",
    company: "Lentra AI Pvt Ltd",
    companyUrl: "https://www.lentra.ai",
    location: "Pune, India",
    startDate: "2022-09",
    // endDate omitted — current role.
    employmentType: "Full-time",
    summary:
      "Backend engineering on AAConnect, Lentra's Account Aggregator platform. The work is " +
      "mostly at integration boundaries: consent lifecycle, financial-information requests, " +
      "and the Account Aggregators and Financial Information Providers on the other side of " +
      "each call.",
    highlights: [
      {
        text:
          "Owned end-to-end development of Spring Boot microservices handling high-volume " +
          "financial data requests.",
      },
      {
        text:
          "Designed and developed REST APIs for secure consent management and financial " +
          "information exchange, integrating multiple Account Aggregators and Financial " +
          "Information Providers.",
      },
      {
        text:
          "Improved system observability using Elastic APM, reducing issue diagnosis time by " +
          "approximately 30%.",
        resumeReported: true,
      },
      {
        text:
          "Enhanced logging, error handling and API consistency, reducing production incidents.",
      },
      {
        text:
          "Implemented distributed caching using Hazelcast, improving scalability and reducing " +
          "latency on repeated lookups.",
      },
      {
        text:
          "Improved performance and reliability through targeted optimisations in " +
          "high-throughput services.",
      },
      {
        text:
          "Built unit and integration tests with JUnit (SpringBootTest, MockMvc) and Mockito " +
          "for mocking external APIs — raising coverage and keeping builds independent of " +
          "third-party availability.",
      },
    ],
    stack: [
      "Java",
      "Spring Boot",
      "REST APIs",
      "Microservices",
      "PostgreSQL",
      "jOOQ",
      "Flyway",
      "Redis",
      "Hazelcast",
      "Spring Retry",
      "JUnit",
      "Mockito",
      "Elastic APM",
      "Docker",
      "Kubernetes",
    ],
    order: 1,
  },
];
