import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArchitectureExplorer } from "./ArchitectureExplorer";
import {
  ARCH_EDGES,
  ARCH_NODES,
  FAILURES,
  LIFECYCLE,
  SEQUENCE,
  SEQUENCE_PARTICIPANTS,
  ZONES,
} from "@/data/architecture";

/**
 * What this file protects, in order of importance:
 *
 * 1. **The architectural corrections.** An earlier version of this diagram
 *    modelled AAConnect as an API gateway reaching banks directly, with no end
 *    user and no consent owner. Those were factual errors about someone's job.
 *    The tests below assert the corrected model so it cannot silently regress.
 * 2. **Protocol accuracy.** Operation names must match the published ReBIT
 *    specifications, and every claim must carry a provenance tag.
 * 3. **Confidentiality.** No provider name, endpoint, hostname or key appears
 *    in the rendered output.
 * 4. **Operability.** Keyboard navigation and the full set of lifecycle
 *    controls, including the requirement that autoplay is never mandatory.
 */

/* ================================================================== */
/* The corrections                                                     */
/* ================================================================== */

describe("the architectural corrections", () => {
  it("models AAConnect as a TSP, not as the Account Aggregator", () => {
    const aa = ARCH_NODES.find((n) => n.id === "aa")!;
    const tspNodes = ARCH_NODES.filter((n) => n.zone === "tsp");

    // They are different participants in different zones.
    expect(aa.zone).toBe("ecosystem");
    expect(tspNodes.length).toBeGreaterThan(0);
    expect(tspNodes.every((n) => n.id !== "aa")).toBe(true);

    // And the AA's own copy says so explicitly.
    expect(aa.detail.join(" ")).toMatch(/not AAConnect, and AAConnect is not this/i);
  });

  it("gives the consent journey to the Account Aggregator, not to AAConnect", () => {
    const aa = ARCH_NODES.find((n) => n.id === "aa")!;
    expect(aa.caption).toMatch(/consent journey/i);
    expect(aa.detail.join(" ")).toMatch(
      /all consent necessarily have to be generated directly on application provided by AA/i,
    );

    // The user-consent stage is owned by the user and the AA — not AAConnect.
    const stage4 = LIFECYCLE.find((s) => s.number === 4)!;
    expect(stage4.actor).toBe("End user");
    expect(stage4.destination).toMatch(/Account Aggregator/);
    expect(stage4.nodes).toContain("enduser");
    expect(stage4.nodes).not.toContain("intake");
  });

  it("includes the end user as a first-class participant", () => {
    const user = ARCH_NODES.find((n) => n.id === "enduser");
    expect(user).toBeDefined();
    expect(SEQUENCE_PARTICIPANTS.some((p) => p.id === "enduser")).toBe(true);
    // The user reaches the AA, and never AAConnect.
    expect(SEQUENCE.some((m) => m.from === "enduser" && m.to === "aa")).toBe(true);
    expect(SEQUENCE.some((m) => m.from === "enduser" && m.to === "aaconnect")).toBe(false);
    expect(SEQUENCE.some((m) => m.to === "enduser" && m.from === "aaconnect")).toBe(false);
  });

  it("never connects AAConnect or the FIU directly to a provider", () => {
    const direct = ARCH_EDGES.filter(
      (e) =>
        (e.to === "fip" && e.from !== "aa") || (e.from === "fip" && e.to !== "aa"),
    );
    expect(direct, "providers must only be reached through the aggregator").toEqual([]);

    const seqDirect = SEQUENCE.filter(
      (m) =>
        (m.to === "fip" && m.from !== "aa") || (m.from === "fip" && m.to !== "aa"),
    );
    expect(seqDirect).toEqual([]);
  });

  it("treats the consent response as a handle, not a consent", () => {
    const stage2 = LIFECYCLE.find((s) => s.number === 2)!;
    expect(stage2.description).toMatch(/ConsentHandle/);
    expect(stage2.description).toMatch(/does not carry a consent|none exists yet/i);
    expect(stage2.operations).toContain("POST /Consent");
  });

  it("models notifications as new inbound calls, not as replies", () => {
    const callback = ARCH_NODES.find((n) => n.id === "callback")!;
    expect(callback.detail.join(" ")).toMatch(/does not stay open/i);

    // Both notifications travel from the AA into AAConnect.
    const notifies = SEQUENCE.filter((m) => m.kind === "notify");
    expect(notifies.length).toBeGreaterThanOrEqual(2);
    expect(notifies.every((m) => m.from === "aa" && m.to === "aaconnect")).toBe(true);
  });

  it("places the analyser downstream of the protocol, not inside it", () => {
    const analyser = ARCH_NODES.find((n) => n.id === "analyser")!;
    expect(analyser.zone).toBe("internal");
    expect(analyser.detail.join(" ")).toMatch(
      /not a ReBIT API and not an Account Aggregator component/i,
    );
  });

  it("separates decryption as its own security boundary", () => {
    const decrypt = ARCH_NODES.find((n) => n.id === "decrypt")!;
    expect(decrypt.kind).toBe("security");
    expect(decrypt.zone).toBe("internal");
  });
});

/* ================================================================== */
/* Protocol accuracy                                                   */
/* ================================================================== */

describe("protocol accuracy", () => {
  it("uses the AA 2.0.0 operation names verbatim", () => {
    const ops = LIFECYCLE.flatMap((s) => s.operations ?? []);
    for (const expected of [
      "POST /Consent",
      "GET /Consent/handle/{consentHandle}",
      "POST /Consent/fetch",
      "POST /FI/request",
      "POST /FI/fetch/{sessionId}",
    ]) {
      expect(ops, `missing ${expected}`).toContain(expected);
    }
  });

  it("uses the FIU 2.0.0 notification endpoints verbatim", () => {
    const ops = LIFECYCLE.flatMap((s) => s.operations ?? []);
    expect(ops).toContain("POST /Consent/Notification");
    expect(ops).toContain("POST /FI/Notification");
  });

  it("names the cipher suite the specification mandates", () => {
    const decrypt = ARCH_NODES.find((n) => n.id === "decrypt")!;
    const text = [...decrypt.detail, ...(decrypt.operations ?? [])].join(" ");
    expect(text).toMatch(/ECDH/);
    expect(text).toMatch(/Curve25519/);
    expect(text).toMatch(/AES/);
    expect(text).toMatch(/GCM/);
  });

  it("uses the real consentStatus and sessionStatus enums", () => {
    const all = LIFECYCLE.map((s) => `${s.description} ${s.risk ?? ""}`).join(" ");
    for (const v of ["ACTIVE", "REJECTED", "REVOKED", "PAUSED", "EXPIRED"]) {
      expect(all, `consentStatus ${v}`).toContain(v);
    }
    for (const v of ["COMPLETED", "FAILED"]) {
      expect(all, `sessionStatus ${v}`).toContain(v);
    }
  });

  it("tags every node, stage and failure with a provenance source", () => {
    const valid = ["spec", "implementation", "illustrative"];
    for (const n of ARCH_NODES) expect(valid, n.id).toContain(n.source);
    for (const s of LIFECYCLE) expect(valid, s.id).toContain(s.source);
    for (const f of FAILURES) expect(valid, f.id).toContain(f.source);
    for (const m of SEQUENCE) expect(valid, m.id).toContain(m.source);
  });

  it("marks unverifiable recovery behaviour as illustrative rather than certain", () => {
    const illustrative = FAILURES.filter((f) => f.source === "illustrative");
    expect(illustrative.length).toBeGreaterThan(0);
    // Nothing tagged `spec` should be promising recovery the spec does not define.
    for (const f of FAILURES.filter((x) => x.source === "spec")) {
      expect(f.handling).not.toMatch(/guarantee/i);
    }
  });
});

/* ================================================================== */
/* Data integrity                                                      */
/* ================================================================== */

describe("data integrity", () => {
  it("has unique ids throughout", () => {
    expect(new Set(ARCH_NODES.map((n) => n.id)).size).toBe(ARCH_NODES.length);
    expect(new Set(ARCH_EDGES.map((e) => e.id)).size).toBe(ARCH_EDGES.length);
    expect(new Set(LIFECYCLE.map((s) => s.id)).size).toBe(LIFECYCLE.length);
    expect(new Set(FAILURES.map((f) => f.id)).size).toBe(FAILURES.length);
    expect(new Set(SEQUENCE.map((m) => m.id)).size).toBe(SEQUENCE.length);
  });

  it("connects every edge between two declared nodes", () => {
    const ids = new Set(ARCH_NODES.map((n) => n.id));
    for (const e of ARCH_EDGES) {
      expect(ids.has(e.from), `${e.id}.from=${e.from}`).toBe(true);
      expect(ids.has(e.to), `${e.id}.to=${e.to}`).toBe(true);
    }
  });

  it("references only declared nodes and edges from each stage", () => {
    const nodeIds = new Set(ARCH_NODES.map((n) => n.id));
    const edgeIds = new Set(ARCH_EDGES.map((e) => e.id));
    for (const s of LIFECYCLE) {
      for (const id of s.nodes) expect(nodeIds.has(id), `${s.id} node ${id}`).toBe(true);
      for (const id of s.edges) expect(edgeIds.has(id), `${s.id} edge ${id}`).toBe(true);
    }
    for (const f of FAILURES) {
      for (const id of f.nodes) expect(nodeIds.has(id), `${f.id} node ${id}`).toBe(true);
    }
  });

  it("numbers the ten stages consecutively", () => {
    expect(LIFECYCLE).toHaveLength(10);
    expect(LIFECYCLE.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("assigns every node to a declared zone", () => {
    const zoneIds = new Set(ZONES.map((z) => z.id));
    for (const n of ARCH_NODES) expect(zoneIds.has(n.zone), n.id).toBe(true);
  });

  it("keeps every node inside the canvas viewBox", () => {
    for (const n of ARCH_NODES) {
      expect(n.x, n.id).toBeGreaterThanOrEqual(0);
      expect(n.x + n.w, n.id).toBeLessThanOrEqual(1240);
      expect(n.y + n.h, n.id).toBeLessThanOrEqual(748);
    }
  });

  it("routes every sequence message between declared participants", () => {
    const ids = new Set(SEQUENCE_PARTICIPANTS.map((p) => p.id));
    for (const m of SEQUENCE) {
      expect(ids.has(m.from), `${m.id}.from`).toBe(true);
      expect(ids.has(m.to), `${m.id}.to`).toBe(true);
      expect(m.stage).toBeGreaterThanOrEqual(1);
      expect(m.stage).toBeLessThanOrEqual(10);
    }
  });

  it("keeps the sequence in chronological stage order", () => {
    const stages = SEQUENCE.map((m) => m.stage);
    expect(stages).toEqual([...stages].sort((a, b) => a - b));
  });

  it("covers every stage in the sequence view, so the two views agree", () => {
    const covered = new Set(SEQUENCE.map((m) => m.stage));
    for (const s of LIFECYCLE) {
      expect(covered.has(s.number), `stage ${s.number} missing from sequence`).toBe(true);
    }
  });

  it("gives every component a full description for the detail panel", () => {
    for (const n of ARCH_NODES) {
      expect(n.responsibility.trim(), n.id).not.toBe("");
      expect(n.incoming.trim(), n.id).not.toBe("");
      expect(n.outgoing.trim(), n.id).not.toBe("");
      expect(n.phase.trim(), n.id).not.toBe("");
      expect(n.failures.length, n.id).toBeGreaterThan(0);
      expect(n.detail.length, n.id).toBeGreaterThan(0);
    }
  });
});

/* ================================================================== */
/* Rendering and interaction                                           */
/* ================================================================== */

/**
 * "Stage N of 10" renders twice on purpose — once in the visible panel and
 * once in the screen-reader live region. These helpers target the visible one
 * so assertions stay unambiguous without weakening into getAllByText.
 *
 * Node labels also render twice: the desktop SVG and the mobile list are both
 * in the DOM, since jsdom applies no CSS and therefore no responsive
 * visibility. Tests take the first match, which is the desktop diagram.
 */
function visibleStageLabel(container: HTMLElement): HTMLElement | null {
  return (
    [...container.querySelectorAll<HTMLElement>("span")].find(
      (el) =>
        !el.classList.contains("sr-only") &&
        /^Stage \d+ of \d+$/.test((el.textContent ?? "").trim()),
    ) ?? null
  );
}

/**
 * Returns the component control for a node id.
 *
 * Matched by its exact accessible name rather than a regex on the label,
 * because the direct-stage-selection buttons are labelled "Stage 1: Client FIU
 * initiates the request" — so a loose /Client FIU/ matches a stage button and
 * the test silently drives the wrong control.
 */
function node(id: string): HTMLElement {
  const n = ARCH_NODES.find((x) => x.id === id)!;
  return screen.getAllByRole("button", { name: `${n.label}. ${n.caption}.` })[0]!;
}

/** The component detail panel's heading, which is the user-visible outcome. */
function componentHeading(): string {
  return (
    [...document.querySelectorAll("h4")]
      .map((h) => h.textContent ?? "")
      .find((t) => ARCH_NODES.some((n) => t.includes(n.label))) ?? ""
  );
}

describe("ArchitectureExplorer — views", () => {
  it("offers three views as a tablist", () => {
    render(<ArchitectureExplorer />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual([
      "Architecture",
      "Sequence",
      "Failure paths",
    ]);
  });

  it("starts on the architecture view", () => {
    render(<ArchitectureExplorer />);
    expect(screen.getByRole("tab", { name: "Architecture" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("switches to the sequence view", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    await user.click(screen.getByRole("tab", { name: "Sequence" }));
    expect(
      screen.getByRole("group", { name: /sequence diagram/i }),
    ).toBeInTheDocument();
  });

  it("switches to the failure view and hides the lifecycle controls", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    await user.click(screen.getByRole("tab", { name: "Failure paths" }));
    expect(screen.getByText(FAILURES[0]!.title)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /play complete request lifecycle/i }),
    ).not.toBeInTheDocument();
  });
});

describe("ArchitectureExplorer — component selection", () => {
  it("renders every component as a control", () => {
    render(<ArchitectureExplorer />);
    for (const node of ARCH_NODES) {
      expect(
        screen.getAllByRole("button", { name: new RegExp(node.label) }).length,
        node.label,
      ).toBeGreaterThan(0);
    }
  });

  it("shows the full responsibility panel for the selected component", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    await user.click(node("aa"));

    expect(
      screen.getByRole("heading", { name: /Selected Account Aggregator/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Responsibility")).toBeInTheDocument();
    expect(screen.getByText("Incoming")).toBeInTheDocument();
    expect(screen.getByText("Outgoing")).toBeInTheDocument();
    expect(screen.getByText("Protocol phase")).toBeInTheDocument();
    expect(screen.getByText("Failure conditions")).toBeInTheDocument();
  });

  it("marks the selected component with aria-pressed", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    const analyser = node("analyser");
    await user.click(analyser);
    expect(analyser).toHaveAttribute("aria-pressed", "true");
  });

  it("is operable from the keyboard with Enter and arrow keys", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    const first = node(ARCH_NODES[0]!.id);
    first.focus();
    await user.keyboard("{Enter}");
    expect(componentHeading()).toContain(ARCH_NODES[0]!.label);

    await user.keyboard("{ArrowRight}");
    expect(componentHeading()).toContain(ARCH_NODES[1]!.label);

    await user.keyboard("{ArrowLeft}");
    await user.keyboard("{ArrowLeft}");
    // Wrapped backwards past the start to the last component.
    expect(componentHeading()).toContain(ARCH_NODES[ARCH_NODES.length - 1]!.label);
  });

  it("shows which zone owns the selected component", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    await user.click(node("fiu"));
    expect(screen.getAllByText("Client side").length).toBeGreaterThan(0);
  });
});

describe("ArchitectureExplorer — lifecycle controls", () => {
  it("shows no stage until one is requested", () => {
    const { container } = render(<ArchitectureExplorer />);
    expect(container.textContent).not.toMatch(/Stage 1 of 10/);
  });

  it("advances manually with Next, without autoplay", async () => {
    const user = userEvent.setup();
    const { container } = render(<ArchitectureExplorer />);

    await user.click(screen.getByRole("button", { name: /next stage/i }));
    expect(visibleStageLabel(container)).toHaveTextContent("Stage 1 of 10");

    await user.click(screen.getByRole("button", { name: /next stage/i }));
    expect(visibleStageLabel(container)).toHaveTextContent("Stage 2 of 10");

    // Still not playing — the Play button has not become Pause.
    expect(
      screen.getByRole("button", { name: /play complete request lifecycle/i }),
    ).toBeInTheDocument();
  });

  it("goes back with Previous", async () => {
    const user = userEvent.setup();
    const { container } = render(<ArchitectureExplorer />);

    await user.click(
      screen.getByRole("button", { name: `Stage 5: ${LIFECYCLE[4]!.title}` }),
    );
    expect(visibleStageLabel(container)).toHaveTextContent("Stage 5 of 10");

    await user.click(screen.getByRole("button", { name: /previous stage/i }));
    expect(visibleStageLabel(container)).toHaveTextContent("Stage 4 of 10");
  });

  it("disables Previous at the first stage and Next at the last", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    expect(screen.getByRole("button", { name: /previous stage/i })).toBeDisabled();

    await user.click(
      screen.getByRole("button", {
        name: `Stage 10: ${LIFECYCLE[9]!.title}`,
      }),
    );
    expect(screen.getByRole("button", { name: /next stage/i })).toBeDisabled();
  });

  it("jumps directly to any stage", async () => {
    const user = userEvent.setup();
    const { container } = render(<ArchitectureExplorer />);

    await user.click(
      screen.getByRole("button", { name: `Stage 8: ${LIFECYCLE[7]!.title}` }),
    );
    expect(visibleStageLabel(container)).toHaveTextContent("Stage 8 of 10");
    expect(screen.getByRole("heading", { name: LIFECYCLE[7]!.title })).toBeInTheDocument();
  });

  it("toggles play and pause", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    await user.click(screen.getByRole("button", { name: /play complete request lifecycle/i }));
    const pauseButton = screen.getByRole("button", { name: /^Pause$/ });
    expect(pauseButton).toBeInTheDocument();

    await user.click(pauseButton);
    expect(
      screen.getByRole("button", { name: /play complete request lifecycle/i }),
    ).toBeInTheDocument();
  });

  it("resets to the full architecture", async () => {
    const user = userEvent.setup();
    const { container } = render(<ArchitectureExplorer />);

    await user.click(screen.getByRole("button", { name: /next stage/i }));
    expect(visibleStageLabel(container)).toHaveTextContent("Stage 1 of 10");

    await user.click(screen.getByRole("button", { name: /show full architecture/i }));
    expect(visibleStageLabel(container)).toBeNull();
  });

  it("announces the current stage in a live region", async () => {
    const user = userEvent.setup();
    const { container } = render(<ArchitectureExplorer />);

    await user.click(
      screen.getByRole("button", { name: `Stage 6: ${LIFECYCLE[5]!.title}` }),
    );
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toHaveTextContent(LIFECYCLE[5]!.title);
    expect(live).toHaveTextContent(LIFECYCLE[5]!.actor);
  });

  it("shows actor, destination and interaction type for the active stage", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    await user.click(
      screen.getByRole("button", { name: `Stage 5: ${LIFECYCLE[4]!.title}` }),
    );
    expect(screen.getAllByText(LIFECYCLE[4]!.actor).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Asynchronous notification").length).toBeGreaterThan(0);
  });
});

describe("ArchitectureExplorer — failure explorer", () => {
  it("lists every failure scenario", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);
    await user.click(screen.getByRole("tab", { name: "Failure paths" }));

    for (const failure of FAILURES) {
      expect(screen.getByText(failure.title)).toBeInTheDocument();
    }
  });

  it("expands a scenario into signal, consequence and handling", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);
    await user.click(screen.getByRole("tab", { name: "Failure paths" }));

    const toggle = screen.getByRole("button", { name: /Decryption failure/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Signal")).toBeInTheDocument();
    expect(screen.getByText("Consequence")).toBeInTheDocument();
    expect(screen.getByText("Handling")).toBeInTheDocument();
  });

  it("collapses a scenario again", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);
    await user.click(screen.getByRole("tab", { name: "Failure paths" }));

    const toggle = screen.getByRole("button", { name: /Consent rejected/ });
    await user.click(toggle);
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});

/* ================================================================== */
/* Confidentiality                                                     */
/* ================================================================== */

describe("confidentiality", () => {
  it("labels the diagram as illustrative rather than production", () => {
    render(<ArchitectureExplorer />);
    const badge = screen.getByText(/illustrative · not production/);
    expect(badge).toHaveAttribute(
      "title",
      expect.stringMatching(/not a reproduction of any production architecture/i),
    );
  });

  it("names no specific Account Aggregator or provider", async () => {
    const user = userEvent.setup();
    const { container } = render(<ArchitectureExplorer />);

    for (const tab of ["Architecture", "Sequence", "Failure paths"]) {
      await user.click(screen.getByRole("tab", { name: tab }));
      const text = (container.textContent ?? "").toLowerCase();
      for (const forbidden of [
        "anumati",
        "finvu",
        "phonepe",
        "nsdl",
        "onemoney",
        "camsfinserv",
        "uatnsdlaa",
      ]) {
        expect(text, `${tab} must not name "${forbidden}"`).not.toContain(forbidden);
      }
    }
  });

  it("exposes no internal hostname, port or key material", async () => {
    const user = userEvent.setup();
    const { container } = render(<ArchitectureExplorer />);

    for (const tab of ["Architecture", "Sequence", "Failure paths"]) {
      await user.click(screen.getByRole("tab", { name: tab }));
      const text = container.textContent ?? "";
      expect(text, tab).not.toMatch(/:\d{4,5}\b/);
      expect(text, tab).not.toMatch(/BEGIN [A-Z ]*PRIVATE KEY/);
      expect(text, tab).not.toMatch(/\b[A-Za-z0-9+/]{40,}={0,2}\b/);
    }
  });

  it("links the public specifications it was built from", () => {
    render(<ArchitectureExplorer />);
    const link = screen.getByRole("link", { name: /Account Aggregator API 2\.0\.0/ });
    expect(link).toHaveAttribute("href", expect.stringContaining("rebit.org.in"));
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});

describe("ownership key", () => {
  it("explains who owns each zone", () => {
    const { container } = render(<ArchitectureExplorer />);
    for (const zone of ZONES) {
      expect(within(container).getAllByText(zone.label).length).toBeGreaterThan(0);
    }
  });
});
