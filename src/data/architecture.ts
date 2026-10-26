/**
 * The AAConnect architecture, lifecycle and failure model.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * WHAT THIS FILE IS, AND WHAT IT IS NOT
 *
 * AAConnect is employer-owned work. Nothing here is proprietary. Every claim
 * falls into exactly one of three buckets, and each one is tagged with a
 * `source` so the UI can label it honestly:
 *
 *   "spec"           — defined by the public ReBIT specifications:
 *                        • Account Aggregator API 2.0.0
 *                        • Financial Information User API 2.0.0
 *                      Operation names, field names, status enums and the
 *                      cryptographic suite below were read from those YAML
 *                      documents, not recalled or inferred.
 *
 *   "implementation" — AAConnect's own orchestration responsibilities,
 *                      described at the level of *what the layer is for*.
 *                      No internal endpoints, service names, topology,
 *                      configuration or code.
 *
 *   "illustrative"   — a conceptual step included so the story is complete,
 *                      which cannot be independently verified from public
 *                      sources. Labelled as such in the UI.
 *
 * This is a high-level illustrative representation of engineering
 * responsibilities. It is NOT a reproduction of any production architecture.
 *
 * ── The correction this file exists to make ──────────────────────────────
 *
 * An earlier version modelled AAConnect as an API gateway sitting between a
 * client and the banks. That was wrong in three ways that matter:
 *
 *   1. AAConnect is a **Technology Service Provider (TSP)** used by client
 *      Financial Information Users. It is not the Account Aggregator, and it
 *      is not a gateway that reaches banks directly.
 *   2. The **Account Aggregator owns the consent journey.** AA 2.0.0 states
 *      it outright: "All consent necessarily have to be generated directly on
 *      application provided by AA." The end user authenticates, discovers,
 *      links and approves inside the AA's own experience — never inside
 *      AAConnect.
 *   3. The flow is **asynchronous**. `POST /Consent` returns a
 *      `ConsentHandle`, not a consent. The artefact only exists after the
 *      user acts, and the FIU learns about it through a callback.
 *
 * ── Why the crypto detail is safe to publish ─────────────────────────────
 *
 * The cipher suite named below is mandated by the public specification, which
 * documents `cryptoAlg: ECDH`, `curve: Curve25519` and
 * `params: cipher=AES/GCM/NoPadding;KeyPairGenerator=ECDH`. Naming it reveals
 * nothing private. No key, certificate, nonce or payload appears anywhere in
 * this repository.
 * ══════════════════════════════════════════════════════════════════════════
 */

/** Where a statement comes from. The UI renders this as a visible badge. */
export type Source = "spec" | "implementation" | "illustrative";

export const SOURCE_LABEL: Record<Source, string> = {
  spec: "ReBIT specification",
  implementation: "AAConnect orchestration",
  illustrative: "Illustrative",
};

export const SOURCE_NOTE: Record<Source, string> = {
  spec:
    "Defined by the public ReBIT AA 2.0.0 / FIU 2.0.0 specifications. Operation " +
    "and field names were read from those documents.",
  implementation:
    "An AAConnect responsibility, described at the level of what the layer is " +
    "for. No internal endpoints, service names or configuration are shown.",
  illustrative:
    "A conceptual step, included so the lifecycle reads end to end. Not " +
    "independently verifiable from public sources — treat it as a sketch.",
};

/* ------------------------------------------------------------------ */
/* Zones                                                               */
/* ------------------------------------------------------------------ */

export type ZoneId = "client" | "tsp" | "ecosystem" | "internal";

export interface Zone {
  id: ZoneId;
  label: string;
  /** One line explaining who owns this zone. */
  note: string;
  x: number;
  y: number;
  w: number;
  h: number;
  accent: string;
}

/** Canvas is 1240 × 748. Geometry is hand-tuned for legibility. */
export const ZONES: Zone[] = [
  {
    id: "client",
    label: "Client side",
    note: "The consuming institution and its end user.",
    x: 20,
    y: 58,
    w: 236,
    h: 300,
    accent: "#5b9cff",
  },
  {
    id: "tsp",
    label: "AAConnect · TSP orchestration",
    note: "Where my work sits. Integration, orchestration and processing.",
    x: 282,
    y: 58,
    w: 452,
    h: 400,
    accent: "#a98bff",
  },
  {
    id: "ecosystem",
    label: "Account Aggregator ecosystem · external",
    note: "RBI-regulated participants. Outside the platform's control.",
    x: 760,
    y: 58,
    w: 458,
    h: 400,
    accent: "#c3abff",
  },
  {
    id: "internal",
    label: "Internal downstream",
    note: "Security boundary and analysis, inside the organisation.",
    x: 282,
    y: 486,
    w: 452,
    h: 236,
    accent: "#4ad6a0",
  },
];

/* ------------------------------------------------------------------ */
/* Nodes                                                               */
/* ------------------------------------------------------------------ */

export type NodeKind =
  | "client"
  | "user"
  | "tsp"
  | "callback"
  | "adapter"
  | "aggregator"
  | "provider"
  | "security"
  | "analyser";

export interface ArchNode {
  id: string;
  label: string;
  kind: NodeKind;
  zone: ZoneId;
  x: number;
  y: number;
  w: number;
  h: number;
  /** One line rendered inside the box. */
  caption: string;
  /** What this component is responsible for. */
  responsibility: string;
  /** What arrives here. */
  incoming: string;
  /** What leaves here. */
  outgoing: string;
  /** Which part of the lifecycle it participates in. */
  phase: string;
  /** How it fails, and what that means downstream. */
  failures: string[];
  /** Longer explanation for the detail panel. */
  detail: string[];
  source: Source;
  /** Protocol operations, verbatim from the spec where applicable. */
  operations?: string[];
  tech?: string[];
}

export const ARCH_NODES: ArchNode[] = [
  /* ---------------- client side ---------------- */
  {
    id: "fiu",
    label: "Client FIU",
    kind: "client",
    zone: "client",
    x: 40,
    y: 96,
    w: 196,
    h: 76,
    caption: "the consuming institution",
    responsibility:
      "A lending or underwriting institution that needs a customer's financial " +
      "records. It is the Financial Information User in protocol terms, and " +
      "AAConnect is the Technology Service Provider it integrates through.",
    incoming: "The final analysed result from AAConnect.",
    outgoing: "The initial request that starts the whole lifecycle.",
    phase: "Stages 1, 3 and 10",
    failures: [
      "A malformed or unauthorised request is rejected at intake before any AA is contacted.",
      "If final delivery fails, the client has no result even though the data was fetched and analysed successfully.",
    ],
    detail: [
      "The client integrates once, with AAConnect, rather than separately with " +
        "every Account Aggregator in the ecosystem. That is the entire reason a " +
        "TSP layer exists.",
      "It is deliberately drawn outside AAConnect: the FIU owns the customer " +
        "relationship and presents the consent link to the user. AAConnect never " +
        "talks to the end user directly.",
    ],
    source: "implementation",
  },
  {
    id: "enduser",
    label: "End user · app & webview",
    kind: "user",
    zone: "client",
    x: 40,
    y: 262,
    w: 196,
    h: 76,
    caption: "approves or rejects consent",
    responsibility:
      "The customer whose data is being requested. They authenticate with the " +
      "Account Aggregator, discover and link accounts, and approve or reject the " +
      "consent request — all inside the AA's own experience.",
    incoming: "A redirect link, presented by the client application.",
    outgoing: "A consent decision, given to the Account Aggregator.",
    phase: "Stage 4",
    failures: [
      "The user abandons the journey — no consent artefact is ever created and no notification arrives.",
      "The user rejects the consent, which the AA reports as consentStatus REJECTED.",
      "The redirect expires before the user opens it.",
    ],
    detail: [
      "This participant is the single most important correction to the earlier " +
        "diagram, which omitted the user entirely and implied the platform could " +
        "obtain consent by itself.",
      "The user never authenticates to AAConnect and never sees it. They are in " +
        "the Account Aggregator's app or webview for the whole of stage 4.",
    ],
    source: "implementation",
  },

  /* ---------------- AAConnect ---------------- */
  {
    id: "intake",
    label: "Request intake & routing",
    kind: "tsp",
    zone: "tsp",
    x: 302,
    y: 96,
    w: 192,
    h: 72,
    caption: "validate · identify · route",
    responsibility:
      "Accepts the client request, validates it, identifies which client it came " +
      "from, and determines which Account Aggregator integration the request " +
      "should be routed through.",
    incoming: "The client FIU's request.",
    outgoing: "A routed, validated request handed to consent orchestration.",
    phase: "Stage 1",
    failures: [
      "Validation rejects a malformed request at the edge, before any external call.",
      "An unknown or unconfigured client cannot be routed to an AA integration.",
    ],
    detail: [
      "Rejecting bad input here matters because a malformed request that reaches " +
        "the integration layer becomes someone else's confusing failure several " +
        "hops away, long after the context is gone.",
      "Which AA serves a given request follows from the client's request and its " +
        "configured integration. The specific routing rules are internal and are " +
        "not described here.",
    ],
    source: "implementation",
    tech: ["Java", "Spring Boot", "REST APIs"],
  },
  {
    id: "consent",
    label: "Consent orchestration",
    kind: "tsp",
    zone: "tsp",
    x: 302,
    y: 192,
    w: 192,
    h: 72,
    caption: "initiate · resolve · fetch",
    responsibility:
      "Submits the consent-initiation request to the selected Account Aggregator, " +
      "tracks the returned ConsentHandle, and — once a notification says the " +
      "state has changed — resolves the handle and fetches the consent artefact.",
    incoming: "A routed request; later, a resolved consent notification.",
    outgoing: "POST /Consent to the AA; a consent artefact once approved.",
    phase: "Stages 2, 3 and 5",
    failures: [
      "The AA rejects the consent-initiation request.",
      "The handle never resolves because the user never completed the journey.",
      "The consent resolves to REJECTED, REVOKED, PAUSED or EXPIRED rather than ACTIVE.",
    ],
    detail: [
      "`POST /Consent` returns a **ConsentHandle** — a tracking reference, not a " +
        "consent. The artefact does not exist until the user has acted on it, " +
        "which is why the next thing that happens is a callback and not a response.",
      "Once a notification arrives, `GET /Consent/handle/{consentHandle}` resolves " +
        "the handle to a consentId and status, and `POST /Consent/fetch` retrieves " +
        "the signed artefact itself.",
    ],
    source: "spec",
    operations: [
      "POST /Consent",
      "GET /Consent/handle/{consentHandle}",
      "POST /Consent/fetch",
    ],
    tech: ["Spring Boot", "PostgreSQL"],
  },
  {
    id: "callback",
    label: "FIU callback endpoints",
    kind: "callback",
    zone: "tsp",
    x: 514,
    y: 192,
    w: 200,
    h: 72,
    caption: "asynchronous notifications",
    responsibility:
      "Implements the FIU side of the protocol — the endpoints the Account " +
      "Aggregator calls to report that a consent or a data session has changed " +
      "state. This is AAConnect receiving events, not making requests.",
    incoming: "Consent and FI status notifications from the AA.",
    outgoing: "Internal events that advance the orchestration state machine.",
    phase: "Stages 5 and 7",
    failures: [
      "A notification never arrives, leaving the request waiting — which is why reconciliation by polling exists as a fallback.",
      "A notification arrives for an unknown handle or session and cannot be correlated.",
      "A duplicate notification is delivered and must not advance the state twice.",
    ],
    detail: [
      "These are defined by the **FIU 2.0.0** specification, which exposes exactly " +
        "two notification endpoints: `/Consent/Notification` and " +
        "`/FI/Notification`. AAConnect implements them on the client's behalf.",
      "Drawing this as a separate component is deliberate. The original " +
        "consent-initiation request does not stay open while the user decides — it " +
        "returned long ago. These notifications are new inbound calls, which is " +
        "why the diagram renders them as their own line style.",
    ],
    source: "spec",
    operations: ["POST /Consent/Notification", "POST /FI/Notification"],
    tech: ["Spring Boot", "PostgreSQL"],
  },
  {
    id: "fi",
    label: "FI request & fetch",
    kind: "tsp",
    zone: "tsp",
    x: 302,
    y: 288,
    w: 192,
    h: 72,
    caption: "request · await · fetch",
    responsibility:
      "Once an active consent exists, raises the financial-information request, " +
      "waits for the session notification, and then fetches the encrypted payload " +
      "for that session.",
    incoming: "An active consent artefact; later, an FI status notification.",
    outgoing: "POST /FI/request, then POST /FI/fetch/{sessionId}.",
    phase: "Stages 6, 7 and 8",
    failures: [
      "The FI request is refused because the consent is not in a usable state.",
      "sessionStatus arrives as FAILED or EXPIRED rather than COMPLETED.",
      "The fetch returns no data, partial data, or data for only some accounts.",
    ],
    detail: [
      "`POST /FI/request` returns a **sessionId** alongside the consentId. The " +
        "data is not in that response — the session is the thing being tracked.",
      "When the AA reports `sessionStatus: COMPLETED`, " +
        "`POST /FI/fetch/{sessionId}` returns the encrypted financial information " +
        "together with the key material needed to decrypt it.",
      "The data returned is bounded by what the approved consent permits. Neither " +
        "the FIU nor AAConnect can widen that scope.",
    ],
    source: "spec",
    operations: ["POST /FI/request", "POST /FI/fetch/{sessionId}"],
    tech: ["Spring Boot", "Spring Retry", "PostgreSQL"],
  },
  {
    id: "adapters",
    label: "AA adapter layer",
    kind: "adapter",
    zone: "tsp",
    x: 302,
    y: 378,
    w: 412,
    h: 66,
    caption: "one internal interface · many AA integrations",
    responsibility:
      "Normalises the differences between Account Aggregator integrations behind " +
      "a single internal interface, so orchestration code is written once rather " +
      "than once per aggregator.",
    incoming: "Protocol calls from consent and FI orchestration.",
    outgoing: "Calls shaped for whichever AA was selected for this request.",
    phase: "Every stage that touches an AA",
    failures: [
      "A provider is unreachable or times out — retried with bounded, backed-off attempts.",
      "A provider returns an error vocabulary the adapter must translate into the platform's own.",
      "A permanent failure stops immediately rather than retrying, because retrying produces the same answer.",
    ],
    detail: [
      "Several licensed Account Aggregators exist, each onboarded separately, each " +
        "with its own timing behaviour and error vocabulary. The adapter layer is " +
        "where that variation is absorbed.",
      "A single request follows exactly one AA path — the one selected for it. " +
        "Multiple integrations exist side by side; they do not all run at once.",
      "This boundary is cheap to add early and expensive to retrofit. It is what " +
        "makes onboarding another aggregator a new adapter rather than a change " +
        "rippling through the business logic.",
    ],
    source: "implementation",
    tech: ["Java", "Spring Retry"],
  },

  /* ---------------- AA ecosystem ---------------- */
  {
    id: "aa",
    label: "Selected Account Aggregator",
    kind: "aggregator",
    zone: "ecosystem",
    x: 786,
    y: 150,
    w: 212,
    h: 88,
    caption: "owns the consent journey",
    responsibility:
      "An RBI-regulated intermediary. It hosts the user-facing consent " +
      "experience, mediates account discovery and linking with the FIPs, manages " +
      "the consent artefact lifecycle, and notifies the FIU when state changes.",
    incoming: "Consent and FI requests from AAConnect; the user's decision.",
    outgoing: "ConsentHandle, notifications, and the encrypted FI payload.",
    phase: "Stages 2, 4, 5, 6, 7 and 8",
    failures: [
      "Unavailable or slow, which AAConnect cannot control and must absorb.",
      "Reports consentStatus REJECTED, REVOKED, PAUSED or EXPIRED.",
      "Reports sessionStatus FAILED or EXPIRED for a data session.",
    ],
    detail: [
      "**This is not AAConnect, and AAConnect is not this.** The aggregator is a " +
        "separate, separately licensed participant. AA 2.0.0 is explicit that " +
        "\"all consent necessarily have to be generated directly on application " +
        "provided by AA\" — the consent screen belongs to the aggregator, always.",
      "It is also data-blind by design: it moves encrypted records between the " +
        "provider and the user without being able to read them.",
      "Because it sits outside the platform, its availability, latency and error " +
        "phrasing are facts to be handled rather than decisions to be made. Most " +
        "of the hard engineering in this system comes from that.",
    ],
    source: "spec",
    operations: [
      "Serves: POST /Consent, /Consent/fetch, /FI/request, /FI/fetch",
      "Calls: POST /Consent/Notification, /FI/Notification",
    ],
  },
  {
    id: "fip",
    label: "Financial Information Providers",
    kind: "provider",
    zone: "ecosystem",
    x: 786,
    y: 310,
    w: 212,
    h: 88,
    caption: "the source of record",
    responsibility:
      "Banks and other institutions holding the customer's accounts. They " +
      "participate in discovery and linking, and return digitally signed, " +
      "encrypted financial information covering exactly the consented scope.",
    incoming: "Discovery, linking and data requests, via the Account Aggregator.",
    outgoing: "Account information and encrypted financial data.",
    phase: "Stages 4 and 6",
    failures: [
      "A provider is unavailable, so some accounts yield no data while others succeed.",
      "An account cannot be discovered or linked for the identifiers given.",
      "A provider returns a payload that fails validation downstream.",
    ],
    detail: [
      "Reached **through the aggregator, never directly.** Neither the FIU nor " +
        "AAConnect can bypass the AA to pull from a provider — that is the point " +
        "of the framework, and the earlier diagram blurred it.",
      "Availability varies between providers, so one having a bad afternoon " +
        "should degrade that path alone and not the request as a whole.",
    ],
    source: "spec",
  },

  /* ---------------- internal downstream ---------------- */
  {
    id: "decrypt",
    label: "Decryption boundary",
    kind: "security",
    zone: "internal",
    x: 302,
    y: 522,
    w: 192,
    h: 78,
    caption: "ECDH key agreement · AES-GCM",
    responsibility:
      "Takes the encrypted payload and its key material, derives the session key, " +
      "decrypts, and validates the result before anything downstream is allowed to " +
      "read it.",
    incoming: "encryptedFI plus KeyMaterial, from the fetch response.",
    outgoing: "Validated, decrypted financial data — or a failure.",
    phase: "Stage 8",
    failures: [
      "Key material is missing, malformed, or its ephemeral public key has expired.",
      "Key agreement produces a session key that cannot decrypt the payload.",
      "Decryption succeeds but the plaintext fails structural validation.",
    ],
    detail: [
      "The specification mandates the suite: `cryptoAlg: ECDH` over " +
        "`curve: Curve25519`, with " +
        "`cipher=AES/GCM/NoPadding;KeyPairGenerator=ECDH`. Each session carries an " +
        "ephemeral `DHPublicKey` with an expiry, plus a `Nonce`.",
      "Decryption is therefore a key *agreement*, not a lookup: the ephemeral " +
        "private key held for the session is combined with the counterparty's " +
        "public key and the nonce to derive a session key, which then decrypts the " +
        "AES-GCM payload.",
      "Drawn as its own boundary because that is what it is. Which key belongs to " +
        "which client is configuration, and configuration is not shown here. No " +
        "key, certificate or payload appears anywhere in this repository.",
    ],
    source: "spec",
    operations: ["cryptoAlg: ECDH", "curve: Curve25519", "AES/GCM/NoPadding"],
  },
  {
    id: "analyser",
    label: "Bank-statement analyser",
    kind: "analyser",
    zone: "internal",
    x: 514,
    y: 522,
    w: 200,
    h: 78,
    caption: "internal · downstream of the protocol",
    responsibility:
      "An internal system that analyses the decrypted financial data and returns " +
      "a result. AAConnect hands it data and takes back an analysis; it does not " +
      "perform the analysis itself.",
    incoming: "Decrypted, validated financial data.",
    outgoing: "An analysis result, returned to AAConnect for delivery.",
    phase: "Stages 9 and 10",
    failures: [
      "Analysis fails or times out, so the client gets no result despite a successful fetch and decryption.",
      "The input is well-formed but too sparse to analyse meaningfully.",
    ],
    detail: [
      "**Not a ReBIT API and not an Account Aggregator component.** It sits " +
        "entirely downstream of the protocol, inside the organisation, and has no " +
        "counterpart in any specification.",
      "Its algorithms are proprietary and are deliberately not described. What " +
        "matters architecturally is only the responsibility boundary: the AA " +
        "ecosystem exchanges consented data, AAConnect orchestrates and decrypts, " +
        "this system analyses, and AAConnect delivers the outcome.",
    ],
    source: "implementation",
  },
];

/* ------------------------------------------------------------------ */
/* Edges                                                               */
/* ------------------------------------------------------------------ */

export type EdgeKind =
  | "sync"
  | "redirect"
  | "notify"
  | "fidata"
  | "encrypted"
  | "internal"
  | "failure";

export interface ArchEdge {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
  d: string;
  label?: string;
}

export const ARCH_EDGES: ArchEdge[] = [
  { id: "fiu-intake", from: "fiu", to: "intake", kind: "sync", d: "M 236 132 H 302", label: "request" },
  { id: "intake-consent", from: "intake", to: "consent", kind: "sync", d: "M 398 168 V 192" },
  { id: "consent-adapters", from: "consent", to: "adapters", kind: "sync", d: "M 360 264 V 378" },
  { id: "adapters-aa", from: "adapters", to: "aa", kind: "sync", d: "M 714 400 C 756 400, 760 194, 786 194", label: "POST /Consent" },
  { id: "intake-fiu", from: "intake", to: "fiu", kind: "sync", d: "M 302 146 H 236", label: "handle + redirect" },
  { id: "fiu-enduser", from: "fiu", to: "enduser", kind: "redirect", d: "M 138 172 V 262", label: "present link" },
  { id: "enduser-aa", from: "enduser", to: "aa", kind: "redirect", d: "M 236 300 C 440 300, 540 474, 724 474 C 776 474, 782 232, 798 196", label: "consent journey · never through AAConnect" },
  { id: "aa-fip", from: "aa", to: "fip", kind: "sync", d: "M 892 238 V 310", label: "discover · link · fetch" },
  { id: "aa-callback", from: "aa", to: "callback", kind: "notify", d: "M 786 216 H 714", label: "notifications" },
  { id: "callback-consent", from: "callback", to: "consent", kind: "internal", d: "M 514 228 H 494" },
  { id: "callback-fi", from: "callback", to: "fi", kind: "internal", d: "M 560 264 C 560 300, 520 324, 494 324" },
  { id: "fi-adapters", from: "fi", to: "adapters", kind: "fidata", d: "M 436 360 V 378" },
  { id: "adapters-fi-data", from: "adapters", to: "fi", kind: "encrypted", d: "M 478 378 V 360", label: "encryptedFI" },
  { id: "fi-decrypt", from: "fi", to: "decrypt", kind: "encrypted", d: "M 340 360 C 340 440, 340 470, 350 522" },
  { id: "decrypt-analyser", from: "decrypt", to: "analyser", kind: "internal", d: "M 494 561 H 514", label: "decrypted data" },
  { id: "analyser-fiu", from: "analyser", to: "fiu", kind: "internal", d: "M 614 600 C 614 700, 300 726, 150 706 C 36 688, 8 360, 118 150 C 124 140, 132 148, 138 160", label: "analysed result" },
  { id: "decrypt-fail", from: "decrypt", to: "fi", kind: "failure", d: "M 320 522 C 300 480, 290 400, 302 324", label: "decryption failure" },
];

export const EDGE_LEGEND: { kind: EdgeKind; label: string; note: string }[] = [
  { kind: "sync", label: "Synchronous request", note: "A call that returns a response on the same connection." },
  { kind: "redirect", label: "Redirect & user action", note: "The user leaves the client app for the AA's own experience." },
  { kind: "notify", label: "Asynchronous notification", note: "A new inbound call from the AA. Not a reply to an open request." },
  { kind: "fidata", label: "Financial-information request", note: "Raising and tracking a data session." },
  { kind: "encrypted", label: "Encrypted payload", note: "Ciphertext plus key material, not yet readable." },
  { kind: "internal", label: "Internal processing", note: "Inside the organisation, downstream of the protocol." },
  { kind: "failure", label: "Failure path", note: "What happens when a stage does not succeed." },
];

/* ------------------------------------------------------------------ */
/* The ten-stage lifecycle                                             */
/* ------------------------------------------------------------------ */

export interface LifecycleStage {
  id: string;
  number: number;
  title: string;
  /** Who acts in this stage. */
  actor: string;
  /** Who receives. */
  destination: string;
  /** The interaction type, matching an edge kind. */
  interaction: EdgeKind;
  description: string;
  nodes: string[];
  edges: string[];
  source: Source;
  /** Verbatim protocol operations involved, where defined. */
  operations?: string[];
  /** What can go wrong at this stage. */
  risk?: string;
}

export const LIFECYCLE: LifecycleStage[] = [
  {
    id: "initiate",
    number: 1,
    title: "Client FIU initiates the request",
    actor: "Client FIU",
    destination: "AAConnect intake",
    interaction: "sync",
    description:
      "The consuming institution asks AAConnect to begin a data request. AAConnect " +
      "validates the request, identifies the client, and determines which Account " +
      "Aggregator integration it should be routed through.",
    nodes: ["fiu", "intake"],
    edges: ["fiu-intake"],
    source: "implementation",
    risk: "A malformed or unauthorised request stops here, before any external system is involved.",
  },
  {
    id: "consent-request",
    number: 2,
    title: "AAConnect submits the consent request",
    actor: "AAConnect",
    destination: "Selected Account Aggregator",
    interaction: "sync",
    description:
      "AAConnect submits consent initiation to the selected aggregator. The " +
      "response carries a ConsentHandle — a tracking reference — and the redirect " +
      "information the user will need. It does not carry a consent: none exists yet.",
    nodes: ["intake", "consent", "adapters", "aa"],
    edges: ["intake-consent", "consent-adapters", "adapters-aa"],
    source: "spec",
    operations: ["POST /Consent"],
    risk: "The aggregator may reject initiation outright, or be unavailable.",
  },
  {
    id: "consent-response",
    number: 3,
    title: "AAConnect returns the initiation response",
    actor: "AAConnect",
    destination: "Client FIU",
    interaction: "sync",
    description:
      "The handle and redirect information go back to the client. This closes the " +
      "first synchronous exchange — nothing stays open while the user decides. " +
      "Everything that follows arrives as a separate event.",
    nodes: ["intake", "fiu"],
    edges: ["intake-fiu"],
    source: "implementation",
    risk: "If the client cannot present the redirect, the journey never starts.",
  },
  {
    id: "user-consent",
    number: 4,
    title: "The user approves or rejects, inside the AA",
    actor: "End user",
    destination: "Selected Account Aggregator",
    interaction: "redirect",
    description:
      "The client application presents the link. The user opens it and completes " +
      "the aggregator's own journey: authenticate, discover accounts, link them, " +
      "review the request, then approve or reject. The aggregator coordinates " +
      "discovery and linking with the providers as part of this.",
    nodes: ["fiu", "enduser", "aa", "fip"],
    edges: ["fiu-enduser", "enduser-aa", "aa-fip"],
    source: "spec",
    risk:
      "The user may abandon the journey or reject the request. Implementations differ in " +
      "their exact screens, and not every interaction here is synchronous.",
  },
  {
    id: "consent-notification",
    number: 5,
    title: "Consent notification arrives",
    actor: "Selected Account Aggregator",
    destination: "AAConnect callback endpoints",
    interaction: "notify",
    description:
      "The aggregator calls the FIU notification endpoint to report the new state. " +
      "AAConnect correlates it to the stored handle, resolves the handle to a " +
      "consentId, and fetches the signed artefact. consentStatus is one of ACTIVE, " +
      "PENDING, REVOKED, PAUSED, REJECTED or EXPIRED.",
    nodes: ["aa", "callback", "consent"],
    edges: ["aa-callback", "callback-consent"],
    source: "spec",
    operations: [
      "POST /Consent/Notification",
      "GET /Consent/handle/{consentHandle}",
      "POST /Consent/fetch",
    ],
    risk:
      "A notification may never arrive, arrive twice, or reference an unknown handle. " +
      "Only ACTIVE permits the data flow to continue.",
  },
  {
    id: "fi-request",
    number: 6,
    title: "Financial-information request is raised",
    actor: "AAConnect",
    destination: "Selected Account Aggregator → Providers",
    interaction: "fidata",
    description:
      "With an active consent, AAConnect raises the data request. The response " +
      "carries a sessionId, not the data. The aggregator then collects the " +
      "requested information from the relevant providers, bounded by what the " +
      "consent permits.",
    nodes: ["fi", "adapters", "aa", "fip"],
    edges: ["fi-adapters", "adapters-aa", "aa-fip"],
    source: "spec",
    operations: ["POST /FI/request"],
    risk: "Refused if the consent is not in a usable state. Provider availability varies.",
  },
  {
    id: "fi-notification",
    number: 7,
    title: "FI notification, then fetch",
    actor: "Selected Account Aggregator",
    destination: "AAConnect callback endpoints",
    interaction: "notify",
    description:
      "The aggregator reports the session state through the FIU notification " +
      "endpoint — sessionStatus is ACTIVE, COMPLETED, EXPIRED or FAILED. On " +
      "COMPLETED, AAConnect fetches the payload for that session. Request, " +
      "notification and fetch are three distinct steps, not one call.",
    nodes: ["aa", "callback", "fi"],
    edges: ["aa-callback", "callback-fi", "adapters-fi-data"],
    source: "spec",
    operations: ["POST /FI/Notification", "POST /FI/fetch/{sessionId}"],
    risk: "FAILED or EXPIRED ends the session. A fetch may return partial data.",
  },
  {
    id: "decrypt",
    number: 8,
    title: "Encrypted payload is decrypted",
    actor: "AAConnect",
    destination: "Decryption boundary",
    interaction: "encrypted",
    description:
      "The fetch returns encryptedFI with its KeyMaterial. The session key is " +
      "derived by ECDH key agreement over Curve25519 using the session's ephemeral " +
      "key pair and nonce, and the payload is decrypted with AES-GCM and validated " +
      "before anything downstream reads it.",
    nodes: ["fi", "decrypt"],
    edges: ["fi-decrypt"],
    source: "spec",
    operations: ["cryptoAlg: ECDH", "curve: Curve25519", "cipher=AES/GCM/NoPadding"],
    risk:
      "Missing or expired key material, a key that cannot decrypt the payload, or " +
      "plaintext that fails validation. Which key belongs to which client is " +
      "configuration and is not shown.",
  },
  {
    id: "analyse",
    number: 9,
    title: "Internal analysis",
    actor: "AAConnect",
    destination: "Bank-statement analyser",
    interaction: "internal",
    description:
      "Decrypted data is handed to the organisation's internal analyser. This is " +
      "downstream of the protocol entirely — not a ReBIT API, not an aggregator " +
      "component. AAConnect passes data in and takes a result back.",
    nodes: ["decrypt", "analyser"],
    edges: ["decrypt-analyser"],
    source: "implementation",
    risk: "Analysis may fail or time out even though fetch and decryption succeeded.",
  },
  {
    id: "deliver",
    number: 10,
    title: "Analysed result returns to the client",
    actor: "Bank-statement analyser",
    destination: "Client FIU",
    interaction: "internal",
    description:
      "AAConnect takes the analysis result and delivers it to the client FIU, " +
      "closing the lifecycle that began in stage 1 — many events and two " +
      "asynchronous notifications later.",
    nodes: ["analyser", "fiu"],
    edges: ["analyser-fiu"],
    source: "implementation",
    risk: "Delivery can fail after everything upstream succeeded, which is the most expensive place to fail.",
  },
];

/* ------------------------------------------------------------------ */
/* Sequence diagram                                                    */
/* ------------------------------------------------------------------ */

export interface SequenceParticipant {
  id: string;
  label: string;
  short: string;
  kind: NodeKind;
}

export const SEQUENCE_PARTICIPANTS: SequenceParticipant[] = [
  { id: "fiu", label: "Client FIU", short: "FIU", kind: "client" },
  { id: "enduser", label: "End user", short: "User", kind: "user" },
  { id: "aaconnect", label: "AAConnect (TSP)", short: "AAConnect", kind: "tsp" },
  { id: "aa", label: "Selected AA", short: "AA", kind: "aggregator" },
  { id: "fip", label: "FIPs", short: "FIP", kind: "provider" },
  { id: "analyser", label: "Analyser", short: "Analyser", kind: "analyser" },
];

export interface SequenceMessage {
  id: string;
  from: string;
  to: string;
  label: string;
  kind: EdgeKind;
  /** Which lifecycle stage this message belongs to. */
  stage: number;
  source: Source;
  /** Rendered as a self-call bracket rather than an arrow between lanes. */
  self?: boolean;
}

export const SEQUENCE: SequenceMessage[] = [
  { id: "s1", from: "fiu", to: "aaconnect", label: "Data request", kind: "sync", stage: 1, source: "implementation" },
  { id: "s2", from: "aaconnect", to: "aaconnect", label: "Validate · identify client · select AA", kind: "internal", stage: 1, source: "implementation", self: true },
  { id: "s3", from: "aaconnect", to: "aa", label: "POST /Consent", kind: "sync", stage: 2, source: "spec" },
  { id: "s4", from: "aa", to: "aaconnect", label: "ConsentHandle + redirect", kind: "sync", stage: 2, source: "spec" },
  { id: "s5", from: "aaconnect", to: "fiu", label: "Handle + redirect info", kind: "sync", stage: 3, source: "implementation" },
  { id: "s6", from: "fiu", to: "enduser", label: "Present consent link", kind: "redirect", stage: 4, source: "implementation" },
  { id: "s7", from: "enduser", to: "aa", label: "Open AA journey · authenticate", kind: "redirect", stage: 4, source: "spec" },
  { id: "s8", from: "aa", to: "fip", label: "Discover & link accounts", kind: "sync", stage: 4, source: "spec" },
  { id: "s9", from: "enduser", to: "aa", label: "Approve or reject consent", kind: "redirect", stage: 4, source: "spec" },
  { id: "s10", from: "aa", to: "aaconnect", label: "POST /Consent/Notification (consentStatus)", kind: "notify", stage: 5, source: "spec" },
  { id: "s11", from: "aaconnect", to: "aa", label: "GET /Consent/handle/{consentHandle}", kind: "sync", stage: 5, source: "spec" },
  { id: "s12", from: "aaconnect", to: "aa", label: "POST /Consent/fetch → artefact", kind: "sync", stage: 5, source: "spec" },
  { id: "s13", from: "aaconnect", to: "aa", label: "POST /FI/request → sessionId", kind: "fidata", stage: 6, source: "spec" },
  { id: "s14", from: "aa", to: "fip", label: "Collect consented information", kind: "fidata", stage: 6, source: "spec" },
  { id: "s15", from: "aa", to: "aaconnect", label: "POST /FI/Notification (sessionStatus)", kind: "notify", stage: 7, source: "spec" },
  { id: "s16", from: "aaconnect", to: "aa", label: "POST /FI/fetch/{sessionId}", kind: "fidata", stage: 7, source: "spec" },
  { id: "s17", from: "aa", to: "aaconnect", label: "encryptedFI + KeyMaterial", kind: "encrypted", stage: 8, source: "spec" },
  { id: "s18", from: "aaconnect", to: "aaconnect", label: "ECDH agreement · AES-GCM decrypt · validate", kind: "encrypted", stage: 8, source: "spec", self: true },
  { id: "s19", from: "aaconnect", to: "analyser", label: "Decrypted financial data", kind: "internal", stage: 9, source: "implementation" },
  { id: "s20", from: "analyser", to: "aaconnect", label: "Analysis result", kind: "internal", stage: 9, source: "implementation" },
  { id: "s21", from: "aaconnect", to: "fiu", label: "Analysed result", kind: "internal", stage: 10, source: "implementation" },
];

/* ------------------------------------------------------------------ */
/* Failure scenarios                                                   */
/* ------------------------------------------------------------------ */

export interface FailureScenario {
  id: string;
  title: string;
  /** Which lifecycle stage it occurs in. */
  stage: number;
  stageTitle: string;
  /** What the system observes. */
  signal: string;
  /** What it means for the request. */
  consequence: string;
  /** How it is handled. Marked illustrative where not verifiable. */
  handling: string;
  source: Source;
  nodes: string[];
}

export const FAILURES: FailureScenario[] = [
  {
    id: "consent-rejected",
    title: "Consent rejected or never completed",
    stage: 4,
    stageTitle: "User approves or rejects",
    signal:
      "consentStatus arrives as REJECTED — or no notification arrives at all, because the user abandoned the journey.",
    consequence:
      "No consent artefact exists, so no data request can ever be raised. The lifecycle ends at stage 4.",
    handling:
      "The request is closed against the stored handle and the outcome reported to the client. A rejection is a valid answer, not an error.",
    source: "spec",
    nodes: ["enduser", "aa", "callback"],
  },
  {
    id: "consent-notification-missing",
    title: "Consent notification never arrives",
    stage: 5,
    stageTitle: "Consent notification",
    signal:
      "The handle stays unresolved past the point where a decision should have been reported.",
    consequence:
      "The request would otherwise wait indefinitely for an event that is not coming.",
    handling:
      "The handle can be resolved directly with GET /Consent/handle/{consentHandle} rather than waiting — polling as reconciliation for a missed callback. Exact timing is implementation-specific.",
    source: "illustrative",
    nodes: ["callback", "consent", "aa"],
  },
  {
    id: "consent-revoked",
    title: "Consent revoked, paused or expired",
    stage: 5,
    stageTitle: "Consent lifecycle",
    signal: "consentStatus is REVOKED, PAUSED or EXPIRED rather than ACTIVE.",
    consequence:
      "A consent that was usable may stop being usable mid-lifecycle. Only ACTIVE permits the data flow.",
    handling:
      "Consent state is re-checked before raising a data request, because the answer changes over time.",
    source: "spec",
    nodes: ["consent", "aa"],
  },
  {
    id: "fi-request-failed",
    title: "FI request refused",
    stage: 6,
    stageTitle: "FI request",
    signal: "The aggregator refuses the data request, or the adapter call fails.",
    consequence: "No session is created, so there is nothing to fetch.",
    handling:
      "Transient failures are retried with bounded, backed-off attempts; a permanent refusal stops immediately, because retrying produces the same answer.",
    source: "implementation",
    nodes: ["fi", "adapters", "aa"],
  },
  {
    id: "fi-session-failed",
    title: "Data session FAILED or EXPIRED",
    stage: 7,
    stageTitle: "FI notification",
    signal: "sessionStatus arrives as FAILED or EXPIRED instead of COMPLETED.",
    consequence:
      "The session yields no payload. A provider outage during collection is a common cause.",
    handling:
      "The session is closed and the outcome surfaced specifically enough to tell a provider outage from a defect in this system.",
    source: "spec",
    nodes: ["callback", "fi", "aa", "fip"],
  },
  {
    id: "fetch-partial",
    title: "Fetch returns partial or no data",
    stage: 7,
    stageTitle: "FI fetch",
    signal:
      "The fetch succeeds but covers only some of the consented accounts, or returns nothing usable.",
    consequence:
      "Downstream analysis may receive less than it expected, which is a different problem from receiving nothing.",
    handling:
      "Partial results are distinguished from empty ones so the client can tell the difference. Specific behaviour varies by integration.",
    source: "illustrative",
    nodes: ["fi", "aa", "fip"],
  },
  {
    id: "decryption-failed",
    title: "Decryption failure",
    stage: 8,
    stageTitle: "Decryption",
    signal:
      "Key material is missing or expired, key agreement yields a key that cannot decrypt the payload, or the plaintext fails validation.",
    consequence:
      "The data was fetched but cannot be read. Nothing downstream may touch it.",
    handling:
      "The payload is rejected at the security boundary and never reaches the analyser. A failure here is reported as a decryption failure specifically, not as a generic error.",
    source: "spec",
    nodes: ["decrypt", "fi"],
  },
  {
    id: "analysis-failed",
    title: "Internal analysis failure",
    stage: 9,
    stageTitle: "Analysis",
    signal: "The analyser errors or times out on well-formed input.",
    consequence:
      "The expensive work — consent, fetch, decryption — all succeeded, and the client still has no result.",
    handling:
      "Reported as an analysis failure rather than a data failure, because the distinction determines who investigates it.",
    source: "implementation",
    nodes: ["analyser", "decrypt"],
  },
  {
    id: "delivery-failed",
    title: "Final delivery failure",
    stage: 10,
    stageTitle: "Delivery",
    signal: "The result cannot be delivered to the client FIU.",
    consequence:
      "The most expensive possible failure: every upstream stage succeeded and the outcome is still lost.",
    handling:
      "The result is retained against the request so delivery can be reattempted rather than the whole lifecycle re-run. Recovery specifics are implementation-dependent.",
    source: "illustrative",
    nodes: ["analyser", "fiu"],
  },
];

/* ------------------------------------------------------------------ */
/* Provenance                                                          */
/* ------------------------------------------------------------------ */

export const SPEC_REFERENCES = [
  {
    label: "Account Aggregator API 2.0.0",
    note: "Consent flow, data flow and notification operations.",
    url: "https://api.rebit.org.in/viewSpec/AA_2_0_0.yaml",
  },
  {
    label: "Financial Information User API 2.0.0",
    note: "The two callback endpoints an FIU exposes.",
    url: "https://api.rebit.org.in/viewSpec/FIU_2_0_0.yaml",
  },
  {
    label: "ReBIT specifications",
    note: "Publisher of the Account Aggregator ecosystem standards.",
    url: "https://api.rebit.org.in/",
  },
];
