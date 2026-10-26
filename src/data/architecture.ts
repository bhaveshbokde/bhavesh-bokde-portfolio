/**
 * The interactive architecture diagram for the AAConnect case study.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * CONFIDENTIALITY — read this before editing.
 *
 * AAConnect is employer-owned work. Everything in this file is written at the
 * level of the **publicly documented Account Aggregator framework** (ReBIT /
 * Sahamati specifications) plus generic, textbook integration patterns.
 *
 * This is an *illustrative* diagram of how a consent-based financial data
 * gateway is generally shaped. It is explicitly NOT a depiction of any
 * employer's internal production architecture. There are:
 *
 *   - no internal service names, hostnames, endpoints or routes
 *   - no named Account Aggregators or Financial Information Providers
 *   - no credentials, tokens, customer data or real consent payloads
 *   - no internal topology, deployment layout or security controls
 *   - no proprietary design decisions
 *
 * Every component here is a generic role ("API gateway", "consent service")
 * that would appear in any public description of the ecosystem. If you add a
 * node, keep it at that altitude. When in doubt, leave it out.
 * ──────────────────────────────────────────────────────────────────────────
 */

export type NodeKind =
  | "client"
  | "gateway"
  | "service"
  | "adapter"
  | "external"
  | "store"
  | "ops";

export interface ArchNode {
  id: string;
  label: string;
  kind: NodeKind;
  /** Position and size within the 1000×520 viewBox. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** One line rendered inside the box. */
  caption: string;
  /** Shown in the detail panel when the node is selected. */
  detail: string[];
  /** Bulleted responsibilities in the detail panel. */
  responsibilities?: string[];
  /** Technologies associated with this role. */
  tech?: string[];
}

export type EdgeKind = "request" | "response" | "async" | "error" | "store" | "observe";

export interface ArchEdge {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
  /** Hand-authored path so the curves stay readable; see NODES for geometry. */
  d: string;
  label?: string;
}

export interface LifecycleStep {
  id: string;
  title: string;
  description: string;
  /** Node ids highlighted during this step. */
  nodes: string[];
  /** Edge ids animated during this step. */
  edges: string[];
  /** Marks the step that illustrates failure handling rather than success. */
  isErrorPath?: boolean;
}

/* ------------------------------------------------------------------ */
/* Nodes                                                               */
/* ------------------------------------------------------------------ */

export const ARCH_NODES: ArchNode[] = [
  {
    id: "client",
    label: "Client application",
    kind: "client",
    x: 24,
    y: 200,
    w: 158,
    h: 66,
    caption: "originates the request",
    detail: [
      "A lending or underwriting application that needs a customer's financial " +
        "records to make a decision. It never talks to the Account Aggregator " +
        "ecosystem directly — it talks to one gateway and gets one contract.",
    ],
    responsibilities: [
      "Starts a consent request on the customer's behalf",
      "Polls or receives callbacks for consent and data status",
      "Consumes structured records once they are available",
    ],
  },
  {
    id: "gateway",
    label: "API gateway",
    kind: "gateway",
    x: 232,
    y: 200,
    w: 158,
    h: 66,
    caption: "one contract, many providers",
    detail: [
      "The single entry point. Its job is to make a fan-out of providers look " +
        "like one coherent REST API to everything above it.",
      "This is also where input is rejected early. A malformed request that " +
        "reaches the integration layer becomes somebody else's confusing " +
        "failure three hops away, so validation belongs at the edge.",
    ],
    responsibilities: [
      "Request validation and authentication",
      "A consistent error contract across every endpoint",
      "Routing to the consent or financial-information path",
    ],
    tech: ["Spring Boot", "REST APIs"],
  },
  {
    id: "consent",
    label: "Consent service",
    kind: "service",
    x: 440,
    y: 92,
    w: 158,
    h: 66,
    caption: "create · status · lifecycle",
    detail: [
      "A consent in this ecosystem is time-bound, scoped and revocable. That " +
        "makes \"is this request still allowed?\" a question with a changing " +
        "answer, so the state transitions have to be explicit rather than " +
        "implied.",
    ],
    responsibilities: [
      "Creating and tracking consent artefacts",
      "Exposing consent status to the caller",
      "Handling revocation and expiry",
    ],
    tech: ["Spring Boot", "PostgreSQL", "jOOQ"],
  },
  {
    id: "fi",
    label: "FI request service",
    kind: "service",
    x: 440,
    y: 308,
    w: 158,
    h: 66,
    caption: "request · fetch · status",
    detail: [
      "Financial-information requests are asynchronous: the data does not come " +
        "back on the call that asked for it. That means correlating a later " +
        "callback with the original request — and reconciling when the callback " +
        "never arrives, rather than leaving the request in limbo.",
    ],
    responsibilities: [
      "Raising data requests against a valid consent",
      "Correlating asynchronous callbacks to the originating request",
      "Polling as a reconciliation fallback",
    ],
    tech: ["Spring Boot", "Spring Retry", "PostgreSQL"],
  },
  {
    id: "adapters",
    label: "Provider adapters",
    kind: "adapter",
    x: 648,
    y: 200,
    w: 158,
    h: 66,
    caption: "one internal interface",
    detail: [
      "Several licensed Account Aggregators, each with its own onboarding, " +
        "timing behaviour and error vocabulary. The adapter layer normalises " +
        "them behind a single internal interface.",
      "This boundary is cheap to add early and expensive to retrofit. It is " +
        "what makes onboarding another provider a new adapter rather than a " +
        "change rippling through the business logic.",
    ],
    responsibilities: [
      "Translating one internal call into each provider's dialect",
      "Normalising provider-specific error codes",
      "Keeping bounded, backed-off retries close to the boundary",
    ],
    tech: ["Java", "Spring Retry"],
  },
  {
    id: "aa",
    label: "Account Aggregators",
    kind: "external",
    x: 798,
    y: 92,
    w: 188,
    h: 66,
    caption: "consent brokers",
    detail: [
      "RBI-regulated intermediaries that carry a customer's consent to the " +
        "institutions holding their data. They are data-blind by design: they " +
        "move encrypted records without being able to read them.",
      "They are outside the platform. The system does not control their " +
        "availability, their latency or how they phrase a failure — which is " +
        "where most of the hard engineering comes from.",
    ],
  },
  {
    id: "fip",
    label: "Financial Info Providers",
    kind: "external",
    x: 798,
    y: 308,
    w: 188,
    h: 66,
    caption: "the source of record",
    detail: [
      "Banks and other institutions that actually hold the data. They return " +
        "digitally signed, structured records covering exactly the scope the " +
        "consent names — and nothing beyond it.",
      "Availability varies between providers, so one having a bad afternoon " +
        "must degrade that path only, never the service as a whole.",
    ],
  },
  {
    id: "db",
    label: "PostgreSQL",
    kind: "store",
    x: 440,
    y: 420,
    w: 158,
    h: 58,
    caption: "consent & request state",
    detail: [
      "Consent and request state has to survive a restart and be auditable " +
        "afterwards, which makes it relational and transactional rather than " +
        "cached or in-memory.",
      "Versioned migrations are the authoritative schema, so every environment " +
        "arrives at the same shape by the same path.",
    ],
    tech: ["PostgreSQL", "jOOQ", "Flyway"],
  },
  {
    id: "cache",
    label: "Distributed cache",
    kind: "store",
    x: 648,
    y: 420,
    w: 158,
    h: 58,
    caption: "shared across replicas",
    detail: [
      "Reference data that is read far more often than it changes gets cached. " +
        "The cache is distributed rather than per-instance: once there is more " +
        "than one replica, local caches drift and two users get two answers.",
    ],
    tech: ["Hazelcast", "Redis", "Spring Cache"],
  },
  {
    id: "obs",
    label: "Observability",
    kind: "ops",
    x: 232,
    y: 420,
    w: 158,
    h: 58,
    caption: "tracing · structured logs",
    detail: [
      "An integration flow spans several hops, and a log line without a thread " +
        "connecting them is close to useless at 2am. Distributed tracing is " +
        "what turns \"the request failed somewhere\" into a named span.",
      "This is the work my resume reports as roughly a 30% reduction in issue " +
        "diagnosis time after the Elastic APM rollout.",
    ],
    tech: ["Elastic APM"],
  },
];

/* ------------------------------------------------------------------ */
/* Edges                                                               */
/* ------------------------------------------------------------------ */

export const ARCH_EDGES: ArchEdge[] = [
  {
    id: "client-gateway",
    from: "client",
    to: "gateway",
    kind: "request",
    d: "M 182 233 H 232",
    label: "REST",
  },
  {
    id: "gateway-consent",
    from: "gateway",
    to: "consent",
    kind: "request",
    d: "M 390 222 C 416 222, 414 125, 440 125",
  },
  {
    id: "gateway-fi",
    from: "gateway",
    to: "fi",
    kind: "request",
    d: "M 390 244 C 416 244, 414 341, 440 341",
  },
  {
    id: "consent-adapters",
    from: "consent",
    to: "adapters",
    kind: "request",
    d: "M 598 125 C 624 125, 622 222, 648 222",
  },
  {
    id: "fi-adapters",
    from: "fi",
    to: "adapters",
    kind: "request",
    d: "M 598 341 C 624 341, 622 244, 648 244",
  },
  {
    id: "adapters-aa",
    from: "adapters",
    to: "aa",
    kind: "request",
    d: "M 806 222 C 816 222, 788 125, 798 125",
  },
  {
    id: "aa-fip",
    from: "aa",
    to: "fip",
    kind: "async",
    d: "M 892 158 V 308",
    label: "consent",
  },
  {
    id: "fip-adapters",
    from: "fip",
    to: "adapters",
    kind: "response",
    d: "M 798 341 C 788 341, 816 244, 806 244",
    label: "signed records",
  },
  {
    id: "consent-db",
    from: "consent",
    to: "db",
    kind: "store",
    d: "M 500 158 V 420",
  },
  {
    id: "fi-db",
    from: "fi",
    to: "db",
    kind: "store",
    d: "M 538 374 V 420",
  },
  {
    id: "adapters-cache",
    from: "adapters",
    to: "cache",
    kind: "store",
    d: "M 727 266 V 420",
  },
  {
    id: "gateway-obs",
    from: "gateway",
    to: "obs",
    kind: "observe",
    d: "M 311 266 V 420",
  },
  {
    id: "adapters-fi-error",
    from: "adapters",
    to: "fi",
    kind: "error",
    d: "M 660 266 C 636 292, 610 384, 578 374",
    label: "retry / fail",
  },
];

/* ------------------------------------------------------------------ */
/* Request lifecycle                                                   */
/* ------------------------------------------------------------------ */

export const LIFECYCLE: LifecycleStep[] = [
  {
    id: "consent-requested",
    title: "Consent is requested",
    description:
      "The client asks for permission, not for data. The gateway validates the " +
      "request and hands it to the consent service, which creates a scoped, " +
      "time-bound consent artefact and records it.",
    nodes: ["client", "gateway", "consent", "db"],
    edges: ["client-gateway", "gateway-consent", "consent-db"],
  },
  {
    id: "consent-carried",
    title: "Consent reaches the ecosystem",
    description:
      "The adapter layer translates one internal call into the dialect of " +
      "whichever Account Aggregator is in play, and the customer approves the " +
      "consent in the aggregator's own journey — never inside this platform.",
    nodes: ["consent", "adapters", "aa"],
    edges: ["consent-adapters", "adapters-aa"],
  },
  {
    id: "fi-requested",
    title: "A data request is raised",
    description:
      "With an active consent, the client asks for the records themselves. The " +
      "FI service raises the request and persists it — because the answer will " +
      "arrive later, on a different connection.",
    nodes: ["client", "gateway", "fi", "db"],
    edges: ["client-gateway", "gateway-fi", "fi-db"],
  },
  {
    id: "provider-returns",
    title: "The provider returns signed records",
    description:
      "The aggregator carries the consent to the institution holding the data. " +
      "The provider returns digitally signed records covering exactly the " +
      "consented scope — and nothing beyond it.",
    nodes: ["aa", "fip", "adapters"],
    edges: ["aa-fip", "fip-adapters"],
  },
  {
    id: "delivered",
    title: "Delivered, cached and traced",
    description:
      "Records are correlated back to the originating request and made " +
      "available to the client. Repeated reference lookups are served from a " +
      "shared cache, and every hop carries a trace so a failure can be located " +
      "rather than guessed at.",
    nodes: ["adapters", "fi", "cache", "obs", "client"],
    edges: ["fi-adapters", "adapters-cache", "gateway-obs"],
  },
  {
    id: "failure",
    title: "When a provider fails",
    description:
      "Transient failures are retried with bounded, backed-off attempts, and " +
      "retries are designed together with idempotency so a second attempt " +
      "produces the same outcome. A permanent failure stops immediately and is " +
      "reported specifically enough to tell a provider outage from a bug.",
    nodes: ["adapters", "fi", "obs"],
    edges: ["adapters-fi-error", "gateway-obs"],
    isErrorPath: true,
  },
];

/** Legend entries, derived from the edge kinds actually used above. */
export const EDGE_LEGEND: { kind: EdgeKind; label: string }[] = [
  { kind: "request", label: "Request path" },
  { kind: "response", label: "Data returned" },
  { kind: "async", label: "Asynchronous / brokered" },
  { kind: "error", label: "Retry & failure path" },
  { kind: "store", label: "Persistence & cache" },
  { kind: "observe", label: "Tracing" },
];
