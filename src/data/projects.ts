import type { Project } from "./types";

/**
 * Projects — both the professional platform and the independent repositories.
 *
 * ## The two kinds, and why the distinction is enforced
 *
 * `kind: "professional"` is work done for an employer on a codebase the
 * employer owns. It gets described, never published: no source, no internal
 * URLs, no proprietary architecture. Every professional entry carries a
 * `confidentialityNote`, which the UI renders prominently.
 *
 * `kind: "independent"` is a personally owned repository that can be linked,
 * cloned and read.
 *
 * ## Status vocabulary
 *
 * `complete` · `maintained` · `in-development` · `planned`. Nothing is marked
 * `complete` that is not, and nothing claims a live demo without a URL that
 * answers. A `links` entry with no `url` renders as "link not configured"
 * rather than as a dead anchor.
 *
 * ## Adding a project
 *
 *   {
 *     slug: "my-service",            // becomes /projects/my-service
 *     name: "My Service",
 *     kind: "independent",
 *     status: "in-development",
 *     category: "Backend service",
 *     summary: "One sentence for the card.",
 *     stack: ["Java", "Spring Boot"],
 *     links: [{ label: "Repository", url: "https://github.com/...", kind: "repository" }],
 *     order: 9,
 *   }
 *
 * Only `slug`, `name`, `kind`, `status`, `category`, `summary` and `stack` are
 * required. Everything else — `problem`, `features`, `architecture`,
 * `implementation`, `testing`, `metrics`, `caseStudy`, `lessons`, `preview` —
 * is optional, and the detail page simply omits any block you leave out.
 *
 * ## A note on the figures
 *
 * Every number in `metrics` is a measurement taken from the project's own
 * tooling (JaCoCo, the Maven Surefire run) and carries its `source`. There are
 * no invented throughput, latency, user-count or revenue numbers anywhere on
 * this site.
 */
export const projects: Project[] = [
  /* ================================================================== */
  /* AAConnect — professional work. Described, not published.           */
  /* ================================================================== */
  {
    slug: "aaconnect",
    name: "AAConnect",
    kind: "professional",
    status: "maintained",
    category: "Account Aggregator platform · Lentra AI",
    featured: true,
    accent: "violet",
    summary:
      "An Account Aggregator gateway connecting lending applications to India's RBI-regulated " +
      "AA ecosystem, so a lender integrates once instead of once per data source.",

    problem:
      "A lender assessing an applicant needs bank statements and other financial records. The " +
      "traditional routes — uploaded PDFs, shared credentials, screen scraping — are slow, " +
      "forgeable and ask the customer to hand over far more access than the decision requires. " +
      "India's Account Aggregator framework replaces all of that with consented, " +
      "machine-readable, digitally signed data drawn from the source institution, under a " +
      "consent the customer can inspect and revoke. Joining that ecosystem, though, is not one " +
      "integration: there are several licensed Account Aggregators and many Financial " +
      "Information Providers, each with its own onboarding, timing behaviour and error " +
      "vocabulary. AAConnect absorbs that fan-out so the applications on top of it see one " +
      "coherent API.",

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
      "MockMvc",
      "Elastic APM",
      "Docker",
      "Kubernetes",
    ],

    confidentialityNote:
      "AAConnect is a professional project owned by Lentra AI, and I am one engineer on the " +
      "team that builds it. Nothing on this page is proprietary: there is no source code, no " +
      "internal endpoint, no repository link, no customer or consent data, and no confidential " +
      "architecture. The description stays at the level of the publicly documented Account " +
      "Aggregator framework, and the diagram uses generic components with synthetic example " +
      "values. Where a detail is internal, it is left out rather than blurred.",

    features: [
      "REST APIs for consent creation, status and lifecycle handling.",
      "Financial information request and fetch flows against consented data.",
      "Adapters for multiple Account Aggregators behind one internal interface.",
      "Integrations with Financial Information Providers for sourcing records.",
      "Asynchronous callback handling with polling as a fallback.",
      "Bounded, idempotent retry handling for transient provider failures.",
      "Request validation, consistent error contracts and structured logging.",
      "Distributed caching for repeated reference lookups.",
    ],

    links: [
      {
        label: "Employer",
        url: "https://www.lentra.ai",
        kind: "other",
      },
    ],

    preview: "/projects/aaconnect-architecture.svg",
    previewAlt:
      "Generic high-level architecture diagram: client applications call an Account Aggregator " +
      "gateway, which uses consent and financial-information services, adapters to several " +
      "Account Aggregators, and a datastore plus distributed cache.",
    // Swaps the static image for the explorable diagram wherever there is room
    // to operate it. The static SVG above is still used on the project card.
    interactiveArchitecture: true,

    caseStudy: [
      {
        id: "context",
        heading: "Business context",
        body: [
          "The Account Aggregator framework is India's consent layer for financial data. A " +
            "customer grants a specific, time-bound, revocable consent; a licensed Account " +
            "Aggregator carries that consent to the institutions holding the data; those " +
            "institutions return signed, structured records. The customer's credentials never " +
            "leave their own bank, and the recipient gets exactly the scope the consent names " +
            "and nothing more.",
          "For a lending platform the value is obvious — underwriting on source data rather " +
            "than on a PDF someone could have edited. The cost is integration surface. Each " +
            "Account Aggregator has to be onboarded separately, and the Financial Information " +
            "Providers behind them vary in availability and in how they signal failure. " +
            "AAConnect exists so that surface is solved once, by a platform team, instead of " +
            "repeatedly by every product that needs financial data.",
        ],
      },
      {
        id: "architecture",
        heading: "High-level architecture",
        body: [
          "The shape is a gateway in front of a set of provider adapters, which is the usual " +
            "answer when several external systems have to look like one to the caller. A " +
            "client application talks to a stable REST API. Behind it, consent handling and " +
            "financial-information handling are separate concerns, and each Account Aggregator " +
            "sits behind an adapter implementing a common internal interface — so onboarding " +
            "another one is a new adapter rather than a change to the calling code.",
          "Consent and request state live in PostgreSQL, because this is state that has to " +
            "survive a restart and be auditable afterwards. Reference data that is read far " +
            "more often than it changes is cached, with a distributed cache so that every " +
            "replica sees the same entry rather than each warming its own copy. Data arrives " +
            "from the ecosystem asynchronously, so the platform both accepts callbacks and " +
            "can reconcile by polling when a callback does not arrive.",
          "The diagram above is deliberately generic. It shows the component roles and the " +
            "direction of calls — enough to discuss the design — and omits internal topology, " +
            "service names, endpoints and security controls.",
        ],
      },
      {
        id: "role",
        heading: "My role and contributions",
        body: [
          "I am a backend engineer on the team that builds and runs the platform; I did not " +
            "build it alone and this page does not claim otherwise. My work has concentrated " +
            "on the service layer and the integration boundaries.",
        ],
        bullets: [
          "End-to-end development of Spring Boot microservices handling financial data requests — API design through to production support.",
          "REST APIs for consent management and for financial information request and status flows.",
          "Integration work against multiple Account Aggregators and Financial Information Providers, including the adapter layer that keeps their differences out of the business logic.",
          "Observability improvements using Elastic APM; the resulting reduction in issue diagnosis time is reported in my resume as approximately 30%.",
          "Logging, exception handling and API response consistency — so that a failure says what failed, and two endpoints fail the same way.",
          "Distributed caching with Hazelcast on repeated lookups.",
          "Performance and reliability work in high-throughput services.",
          "Unit and integration tests with JUnit, SpringBootTest, MockMvc and Mockito, mocking external providers so the build does not depend on their uptime.",
        ],
      },
      {
        id: "technologies",
        heading: "Technologies, and why they fit",
        bullets: [
          "Java and Spring Boot — the ecosystem's defaults for this kind of service, and the reason a new engineer can read the code on day one. Spring's declarative transactions, validation and scheduling cover most of what an integration service needs without hand-rolled infrastructure.",
          "PostgreSQL — consent and request state is relational, must survive restarts and has to be queryable for support. Transactional guarantees here are the difference between an auditable record and a guess.",
          "jOOQ — for the queries where the SQL itself is the design and an ORM would obscure it, with compile-time checking against the schema rather than string concatenation.",
          "Flyway — versioned migrations as the authoritative schema, so every environment reaches the same shape by the same path.",
          "Redis and Hazelcast — caching for read-heavy reference data. A distributed cache matters once there is more than one replica: otherwise each instance keeps its own answer and they drift.",
          "Spring Retry — transient provider failures are normal in this ecosystem, so retries are explicit, bounded and backed off rather than left to the caller.",
          "JUnit, Mockito, SpringBootTest and MockMvc — external systems are mocked so correctness is tested without a network, and controller contracts are exercised without starting a server.",
          "Elastic APM — distributed tracing across service hops, which is what turns 'the request failed somewhere' into a span with a name.",
          "Docker and Kubernetes — packaging and running services, with scaling handled by replica count rather than by bigger machines.",
        ],
      },
      {
        id: "challenges",
        heading: "Integration and reliability challenges",
        body: [
          "Almost every hard problem in this work comes from the same root: the system does not " +
            "control the systems it depends on.",
        ],
        bullets: [
          "Heterogeneous providers. Several Account Aggregators, each with its own behaviour and error vocabulary, have to present one contract to the caller. The adapter layer is where that normalisation happens, so a provider quirk stays in one file instead of spreading through the service.",
          "Asynchronous delivery. Data does not come back on the same call that asked for it. That means correlating a later callback with the original request, and reconciling when the callback never arrives rather than leaving a request in limbo.",
          "Retries that must not duplicate. A retry is only safe if repeating it is harmless, so retry handling and idempotency are designed together — bounded attempts, backoff, and a path that produces the same outcome the second time.",
          "Consent lifecycle. A consent is time-bound and revocable, so 'is this request still allowed?' is a question with a changing answer. The state transitions have to be explicit, not implied.",
          "Partial availability. One provider having a bad afternoon should degrade that path, not the service. Failures are isolated and reported specifically enough to tell a provider outage from a bug.",
          "Validation at the edge. Malformed input is rejected at the boundary with a clear error, because a bad request that reaches the integration layer becomes someone else's confusing failure.",
        ],
      },
      {
        id: "quality",
        heading: "Testing, monitoring and error handling",
        bullets: [
          "External providers are mocked with Mockito, so the test suite exercises our logic and never depends on a third party being up — a dependency outage is an incident, not a red build.",
          "Controller contracts are tested with MockMvc and service wiring with SpringBootTest, which catches the configuration mistakes that unit tests structurally cannot see.",
          "Elastic APM gives traces across service boundaries; the work I did there was aimed squarely at shortening the gap between 'something is wrong' and 'this is the call that failed'.",
          "Structured logging with correlation through a request's lifecycle, because an integration flow spans several hops and a log line without that thread is close to useless.",
          "A consistent error contract: the same failure shape across endpoints, with enough detail to act on and nothing sensitive in the payload.",
          "Caching on repeated lookups, and targeted optimisation in high-throughput paths, measured against the service's own metrics rather than assumed.",
        ],
      },
      {
        id: "outcomes",
        heading: "Outcomes and engineering lessons",
        body: [
          "The honest version of outcomes: the platform runs in production and serves lending " +
            "applications, and the improvement I can point to specifically is the observability " +
            "work — my resume reports roughly a 30% reduction in issue diagnosis time following " +
            "the Elastic APM rollout. Throughput, latency and volume figures are not published " +
            "here, because they are the employer's numbers and not mine to disclose.",
        ],
        bullets: [
          "Observability is a feature, and it pays for itself first. Tracing changed how quickly a problem could be located more than any single code change did.",
          "An adapter boundary is cheap to add early and expensive to retrofit. Keeping provider differences in one layer is what made onboarding another provider a bounded task.",
          "Retries without idempotency are a way of turning one problem into several. The two have to be designed at the same time.",
          "Consistent error handling is an interface decision, not a tidiness one — callers build logic on the shape of your failures.",
          "Mocking external systems in tests is what lets a team keep shipping on a day when a provider is down.",
        ],
      },
    ],
    order: 1,
  },

  /* ================================================================== */
  /* Independent projects                                               */
  /* ================================================================== */
  {
    slug: "finsight",
    name: "FinSight",
    kind: "independent",
    status: "complete",
    category: "Financial analytics backend",
    featured: true,
    accent: "blue",
    summary:
      "A cash-flow analytics backend built around a transactional outbox and two independent " +
      "idempotency layers, so a redelivered Kafka message cannot import the same statement twice.",

    problem:
      "Record income and expenses, import bank-style CSV statements, set budgets and read " +
      "cash-flow reports. The CRUD is not the interesting part — the interesting part is that " +
      "publishing a Kafka event and committing a database row are two different systems with no " +
      "shared transaction, and that an at-least-once pipeline will eventually hand you the same " +
      "statement twice.",

    stack: [
      "Java 21",
      "Spring Boot 3.5",
      "PostgreSQL 16",
      "Flyway",
      "Redis 7.4",
      "Apache Kafka 3.9",
      "Spring Security",
      "JWT",
      "JUnit 5",
      "JaCoCo",
    ],

    features: [
      "Registration and stateless JWT authentication.",
      "Transaction recording with exact money handling end to end.",
      "CSV statement import with partial-failure semantics.",
      "Categories, monthly budgets and cash-flow reporting.",
      "Per-user cached reports that fail open when Redis is unavailable.",
      "OpenAPI 3 documentation and a Swagger UI.",
    ],

    architecture: [
      "A modular Spring Boot monolith rather than services — at this size, module boundaries " +
        "give the separation and nothing has to be paid for in network calls and distributed " +
        "debugging.",
      "The dual-write problem between PostgreSQL and Kafka is solved with a transactional " +
        "outbox: the event row is INSERTed in the same local transaction as the business " +
        "change, and a poller publishes it afterwards. This buys at-least-once delivery, and " +
        "the project says at-least-once rather than claiming exactly-once.",
      "Because delivery is at-least-once, duplicates are expected and absorbed by two " +
        "independent mechanisms: a `processed_events` ledger claimed atomically with " +
        "`INSERT … ON CONFLICT DO NOTHING`, and a partial unique index on `(user_id, " +
        "external_ref)` where the reference is `sha256(fileChecksum + ':' + rowNumber)`.",
    ],

    implementation: [
      "User-data isolation lives in the WHERE clause of every query, never as a check applied " +
        "after the fact. Cross-user access returns 404 rather than 403, so the API cannot be " +
        "used as an existence oracle.",
      "Money is exact end to end: BigDecimal in Java, NUMERIC(19,4) in PostgreSQL, amounts " +
        "always positive with direction carried by the transaction type.",
      "One bad row does not reject a 2,000-row statement — valid rows are inserted and invalid " +
        "ones recorded individually with a line number and a reason.",
      "Redis caching is namespaced by user id, bound to concrete value types, and fails open: " +
        "a cache outage degrades to reading PostgreSQL, never to a failed request.",
    ],

    testing: [
      "179 unit tests and 157 integration tests, run against real PostgreSQL, Redis and Kafka " +
        "rather than mocks of them.",
      "70 end-to-end API assertions against the running application.",
      "Coverage is measured with JaCoCo and reported, never asserted at a threshold — a minimum " +
        "percentage encourages tests that raise the number instead of tests that find defects.",
    ],

    metrics: [
      { label: "Tests", value: "336 passing", source: "179 unit + 157 integration" },
      { label: "Line coverage", value: "80.9%", source: "measured by JaCoCo" },
      { label: "E2E assertions", value: "70", source: "against the running app" },
    ],

    links: [
      {
        label: "Repository",
        url: "https://github.com/bhaveshbokde/finsight-financial-backend",
        kind: "repository",
      },
    ],

    preview: "/projects/finsight.svg",
    previewAlt:
      "Diagram of the FinSight outbox pipeline: a single transaction writes both the business " +
      "row and an outbox event, a poller publishes to Kafka, and an idempotent consumer absorbs " +
      "duplicates.",

    lessons: [
      "At-least-once delivery is a design input, not a defect to apologise for — the work is in making the consumer idempotent.",
      "A unique index decides a race; an application-level 'have I seen this?' check is a read followed by a write, and two concurrent retries both pass it.",
      "A cache should fail open. A cache outage that takes the application down has made reliability worse, not better.",
    ],

    order: 2,
  },

  {
    slug: "ecommerce-backend",
    name: "E-commerce Backend",
    kind: "independent",
    status: "complete",
    category: "Commerce API",
    accent: "emerald",
    summary:
      "A commerce API where overselling is structurally impossible — five units and twenty " +
      "simultaneous checkouts produce exactly five orders, enforced by SQL rather than by a " +
      "Java lock that only protects one JVM.",

    problem:
      "Catalogue, cart, checkout, inventory and payment for a small shop. No real money moves: " +
      "the payment provider is a deterministic simulator. Everything around it — the " +
      "idempotency key and the unique index behind it, the stock reservation that must be " +
      "released when a charge fails, the order state machine — is real, and that is where the " +
      "problems are.",

    stack: [
      "Java 21",
      "Spring Boot 3.5",
      "PostgreSQL 16",
      "Redis 7",
      "Flyway",
      "Spring Security",
      "JWT",
      "JUnit 5",
      "JaCoCo",
      "Docker Compose",
    ],

    features: [
      "38 endpoints covering authentication, catalogue, cart, checkout and orders.",
      "Role-separated access: public catalogue, authenticated cart, admin catalogue management.",
      "Concurrency-safe inventory with reservation and release.",
      "Idempotent payment handling via an Idempotency-Key header.",
      "Order state machine with price snapshotting.",
    ],

    architecture: [
      "Overselling is prevented by a single conditional UPDATE — `SET available = available - " +
        ":qty WHERE product_id = :id AND available >= :qty`. The check and the decrement are " +
        "one statement, so there is no window between them; PostgreSQL re-evaluates the WHERE " +
        "clause against the freshly committed row and the loser's statement affects zero rows. " +
        "A `CHECK (available >= 0)` constraint sits underneath as a backstop.",
      "A retried payment charges once. A unique index on `(user_id, idempotency_key)` decides " +
        "the race and the original outcome is replayed — the index is the guarantee, the " +
        "application-level check is only an optimisation.",
      "`order_items` snapshots the SKU, name and unit price at purchase time. This looks like a " +
        "normalisation error and is the opposite: an order is a financial record of an event " +
        "that already happened, so repricing a product afterwards must rewrite nothing.",
    ],

    testing: [
      "365 unit tests needing no external services, plus 141 integration, security and " +
        "concurrency tests against real PostgreSQL and Redis.",
      "The concurrency tests use real threads released simultaneously by a CyclicBarrier " +
        "against a real database — a mock cannot demonstrate atomicity, because atomicity is a " +
        "property of PostgreSQL's row locking rather than of the Java code.",
    ],

    metrics: [
      { label: "Tests", value: "506 passing", source: "365 unit + 141 integration" },
      { label: "Line coverage", value: "84.9%", source: "measured by JaCoCo" },
      { label: "Endpoints", value: "38", source: "documented in docs/API-TESTING.md" },
    ],

    links: [
      {
        label: "Repository",
        url: "https://github.com/bhaveshbokde/ecommerce-backend",
        kind: "repository",
      },
    ],

    preview: "/projects/ecommerce.svg",
    previewAlt:
      "Diagram of concurrency-safe checkout: twenty concurrent requests hit one conditional SQL " +
      "update, five succeed and fifteen receive a 409 insufficient-stock response.",

    lessons: [
      "Correctness under concurrency belongs in the database when the database is the shared state. A synchronized block protects one JVM; production has several.",
      "Idempotency is enforced by a constraint or it is not enforced.",
      "Denormalising a financial record is not a mistake — an invoice must not change when the catalogue does.",
    ],

    order: 3,
  },

  {
    slug: "notification-service",
    name: "Notification Service",
    kind: "independent",
    status: "complete",
    category: "Asynchronous messaging",
    accent: "cyan",
    summary:
      "Multi-channel notification delivery built on a transactional outbox, with three " +
      "distinct failure classes that deliberately do not share a code path.",

    problem:
      "A notification platform sits between an application that wants to tell a user something " +
      "and the providers that deliver it. Saving a notification and publishing its event are " +
      "not atomic; a retried request must not send a second SMS; and 'failed' means three " +
      "different things that need three different responses.",

    stack: [
      "Java 21",
      "Spring Boot 3.5",
      "PostgreSQL 16",
      "Apache Kafka 3.9",
      "Redis 7",
      "Flyway",
      "JUnit 5",
      "Testcontainers",
      "JaCoCo",
    ],

    features: [
      "EMAIL, SMS and IN_APP channels behind a provider registry.",
      "Transactional outbox so an accepted notification is never silently lost.",
      "Idempotency keys arbitrated by a unique index.",
      "Redis-backed rate limiting.",
      "Bounded retry with exponential backoff and dead-lettering.",
      "Delivery attempt history per notification.",
    ],

    architecture: [
      "The event row is written into `outbox_events` in the same transaction as the " +
        "notification — both commit or neither does. A separate publisher drains the table and " +
        "marks a row PUBLISHED only after the broker acknowledges. The cost is stated plainly: " +
        "delivery is at-least-once, which is why the consumer is idempotent.",
      "Three failure classes are kept apart on purpose. A transient failure (provider timeout, " +
        "5xx, rate limit) is retried with backoff. A permanent failure (malformed recipient, " +
        "rejected content) fails immediately, because retrying produces the same answer. A dead " +
        "letter means the pipeline could not process the message at all — that is the one to " +
        "alert on, and it lives in its own table so the query that matters is not buried in " +
        "noise from providers having a bad day.",
      "Provider adapters are deterministic local simulators. Every API response carries " +
        "`\"simulated\": true`, so nothing in the project pretends to have sent a real message.",
    ],

    testing: [
      "166 unit tests needing no infrastructure, plus 89 integration, security and concurrency " +
        "tests, plus a Testcontainers profile.",
      "Idempotency is proved with twelve simultaneous requests against a real database rather " +
        "than asserted in a comment.",
      "The test report documents the three real bugs the suite found.",
    ],

    metrics: [
      { label: "Tests", value: "255 passing", source: "166 unit + 89 integration" },
      { label: "Line coverage", value: "81.1%", source: "measured by JaCoCo" },
    ],

    links: [
      {
        label: "Repository",
        url: "https://github.com/bhaveshbokde/notification-service",
        kind: "repository",
      },
    ],

    preview: "/projects/notification.svg",
    previewAlt:
      "Diagram of the notification pipeline: API writes notification and outbox event in one " +
      "transaction, a publisher drains to Kafka, and a consumer fans out to email, SMS and " +
      "in-app adapters with a dead-letter path.",

    lessons: [
      "Naming failure classes separately is a design decision with operational consequences: a rising provider-failure count and a rising dead-letter count mean completely different things.",
      "An outbox is the cheapest honest answer to the dual-write problem.",
      "Simulated providers are worth saying out loud in the API response, not just the README.",
    ],

    order: 4,
  },

  {
    slug: "sql-interview-mastery",
    name: "SQL Interview Mastery",
    kind: "independent",
    status: "complete",
    category: "Interactive learning platform",
    accent: "violet",
    summary:
      "An interactive SQL learning application with a real editor that runs your query against " +
      "a real PostgreSQL database — and where no expected output was ever typed by a human.",

    problem:
      "Written SQL tutorials have a defect that is invisible to review: a result table that " +
      "the query does not actually produce. A plausible wrong result reads exactly like a right " +
      "one, so it survives proofreading — and a learner who runs the example, gets something " +
      "different and concludes they have misunderstood is worse off than if the example had " +
      "never been written.",

    stack: [
      "Java 21",
      "Spring Boot",
      "PostgreSQL",
      "Flyway",
      "React 18",
      "TypeScript",
      "Vite",
      "CodeMirror",
      "JUnit 5",
      "Vitest",
    ],

    features: [
      "Curriculum across 9 modules, from the relational model to window functions, recursive CTEs, MVCC and isolation levels, execution plans and JSONB indexing.",
      "A CodeMirror SQL editor that executes against a real database and returns real rows.",
      "43 quiz questions with scoring, and practice problems evaluated on the result set rather than on string equality.",
      "Progress tracking with a spaced-revision scheduler.",
      "Server-enforced execution limits, surfaced in the UI so a learner knows why a query was cut off.",
    ],

    architecture: [
      "Every SQL statement in every lesson, exercise, solution and wrong-answer demonstration " +
        "is executed against the real dataset at record time, and whatever PostgreSQL returned " +
        "is what the page displays. There are 454 recorded outputs, and the application " +
        "**refuses to start** if any statement in the curriculum lacks one. Showing a wrong " +
        "result table stops being a thing that can happen by accident.",
      "The playground runs under a different database identity from the rest of the " +
        "application. Spring's `DataSourceAutoConfiguration` is explicitly excluded so that " +
        "separation cannot be undone by a default — the security model rests on the playground " +
        "never holding the application's privileges.",
      "Answers are compared as result sets, not as text. Two queries that reach the same rows " +
        "by different routes both pass, which is the behaviour a learner expects and the " +
        "behaviour a string comparison cannot provide.",
    ],

    implementation: [
      "Every limit is enforced on the server: a request from curl gets exactly the same " +
        "treatment as one from the UI. The frontend only displays the limits; it never decides " +
        "them.",
      "`statement_timeout` is set on the connection, so a runaway query is cancelled by " +
        "PostgreSQL rather than by abandoning a thread — the work actually stops.",
      "Row count is bounded with `Statement.setMaxRows`, which stops the JDBC driver " +
        "materialising more than the cap, so a SELECT over a large join cannot exhaust the heap.",
      "Statement length is checked before parsing, because the parser is itself an attack " +
        "surface.",
      "A schema allowlist rejects any reference outside the learning schema — including the " +
        "schema where the solutions live, and `pg_catalog`.",
      "Concurrent playground queries are capped process-wide and refused rather than queued, " +
        "so a burst cannot tie up every connection in the learner pool.",
      "Versioned Flyway migrations own the schema, with the grants resolved to whichever role " +
        "the deployment provisioned.",
    ],

    testing: [
      "232 backend tests and 26 frontend tests, all passing — covering input validation, " +
        "result comparison, learner isolation, the revision scheduler, and the playground API.",
      "Coverage is not quoted: JaCoCo cannot instrument the SQL parser dependency (a generated " +
        "method exceeds the JVM method size limit), so any figure would be measured over an " +
        "incomplete set and would overstate what was actually checked.",
    ],

    metrics: [
      { label: "Backend tests", value: "232 passing", source: "Maven Surefire" },
      { label: "Frontend tests", value: "26 passing", source: "Vitest" },
      { label: "Recorded outputs", value: "454", source: "executed, never hand-written" },
      { label: "Quiz questions", value: "43", source: "across 9 modules" },
    ],

    links: [
      {
        label: "Repository",
        url: "https://github.com/bhaveshbokde/sql-interview-mastery",
        kind: "repository",
      },
    ],

    preview: "/projects/sql-lab.svg",
    previewAlt:
      "Diagram of SQL Interview Mastery: a curriculum service and an evaluation service over a " +
      "sandboxed query playground running against a real PostgreSQL dataset.",

    lessons: [
      "The most valuable property of this project is a negative one — it cannot show you a result its own database would not produce. Correctness guarantees are worth more when they are structural than when they are a review checklist.",
      "Running a learner's SQL safely is a database problem, not a string-filtering problem. Timeouts, row caps and schema allowlists belong where the query executes, under an identity that could not do damage even if the validation were bypassed.",
      "Evaluating a result set rather than a string is more work and the only approach that does not punish a correct answer for being phrased differently.",
    ],

    order: 5,
  },
];
