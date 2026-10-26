import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArchitectureExplorer } from "./ArchitectureExplorer";
import { ARCH_EDGES, ARCH_NODES, LIFECYCLE } from "@/data/architecture";

/**
 * Two things this file is really protecting:
 *
 * 1. That the diagram is operable without a mouse — every component is a real
 *    control, reachable and activatable from the keyboard.
 * 2. That the confidentiality framing cannot be quietly removed. The badge and
 *    its explanation are asserted, and so is the absence of any named Account
 *    Aggregator or internal identifier anywhere in the rendered output.
 */

describe("ArchitectureExplorer — structure", () => {
  it("renders every component from the data", () => {
    render(<ArchitectureExplorer />);
    for (const node of ARCH_NODES) {
      expect(
        screen.getByRole("button", { name: new RegExp(node.label) }),
        node.label,
      ).toBeInTheDocument();
    }
  });

  it("renders one step control per lifecycle step", () => {
    render(<ArchitectureExplorer />);
    for (let i = 1; i <= LIFECYCLE.length; i += 1) {
      expect(screen.getByRole("button", { name: String(i) })).toBeInTheDocument();
    }
  });

  it("renders a legend covering the edge kinds actually used", () => {
    render(<ArchitectureExplorer />);
    expect(screen.getByText("Request path")).toBeInTheDocument();
    expect(screen.getByText("Data returned")).toBeInTheDocument();
    expect(screen.getByText("Persistence & cache")).toBeInTheDocument();
  });

  it("distinguishes the failure path from the success paths in the legend", () => {
    render(<ArchitectureExplorer />);
    expect(screen.getByText("Retry & failure path")).toBeInTheDocument();
  });

  it("describes the diagram for assistive technology", () => {
    render(<ArchitectureExplorer />);
    expect(
      screen.getByRole("group", { name: /interactive architecture diagram/i }),
    ).toBeInTheDocument();
  });
});

describe("ArchitectureExplorer — selecting components", () => {
  it("shows a default component without requiring a click", () => {
    render(<ArchitectureExplorer />);
    expect(screen.getByRole("heading", { name: /API gateway/ })).toBeInTheDocument();
  });

  it("swaps the detail panel when another component is clicked", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    await user.click(screen.getByRole("button", { name: /Consent service/ }));

    expect(screen.getByRole("heading", { name: /Consent service/ })).toBeInTheDocument();
    expect(screen.getByText(/time-bound, scoped and revocable/i)).toBeInTheDocument();
  });

  it("marks the selected component with aria-pressed", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    const consent = screen.getByRole("button", { name: /Consent service/ });
    expect(consent).toHaveAttribute("aria-pressed", "false");

    await user.click(consent);
    expect(consent).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the responsibilities and stack for the selected component", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    await user.click(screen.getByRole("button", { name: /PostgreSQL/ }));
    expect(screen.getByText("Flyway")).toBeInTheDocument();
  });
});

describe("ArchitectureExplorer — keyboard operation", () => {
  it("makes every component focusable", () => {
    render(<ArchitectureExplorer />);
    for (const node of ARCH_NODES) {
      expect(screen.getByRole("button", { name: new RegExp(node.label) })).toHaveAttribute(
        "tabindex",
        "0",
      );
    }
  });

  it("selects on Enter", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    const node = screen.getByRole("button", { name: /Provider adapters/ });
    node.focus();
    await user.keyboard("{Enter}");

    expect(node).toHaveAttribute("aria-pressed", "true");
  });

  it("selects on Space", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    const node = screen.getByRole("button", { name: /Distributed cache/ });
    node.focus();
    await user.keyboard(" ");

    expect(node).toHaveAttribute("aria-pressed", "true");
  });

  it("moves between components with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    const first = screen.getByRole("button", {
      name: new RegExp(ARCH_NODES[0]!.label),
    });
    first.focus();
    await user.keyboard("{ArrowRight}");

    const second = screen.getByRole("button", {
      name: new RegExp(ARCH_NODES[1]!.label),
    });
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute("aria-pressed", "true");
  });

  it("wraps backwards from the first component to the last", async () => {
    const user = userEvent.setup();
    render(<ArchitectureExplorer />);

    screen.getByRole("button", { name: new RegExp(ARCH_NODES[0]!.label) }).focus();
    await user.keyboard("{ArrowLeft}");

    expect(
      screen.getByRole("button", {
        name: new RegExp(ARCH_NODES[ARCH_NODES.length - 1]!.label),
      }),
    ).toHaveFocus();
  });
});

/**
 * "Step N of" appears twice on purpose: once in the visible panel and once in
 * the screen-reader live region. These helpers target the visible one, so the
 * assertions stay unambiguous without weakening into getAllByText.
 */
function visibleStepLabel(container: HTMLElement): HTMLElement | null {
  return (
    [...container.querySelectorAll<HTMLElement>("p")].find(
      (p) =>
        !p.classList.contains("sr-only") && /^Step \d+ of/.test(p.textContent ?? ""),
    ) ?? null
  );
}

describe("ArchitectureExplorer — lifecycle walkthrough", () => {
  it("shows no step until one is asked for", () => {
    const { container } = render(<ArchitectureExplorer />);
    expect(container.textContent).not.toMatch(/Step 1 of/);
  });

  it("shows a step when its number is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<ArchitectureExplorer />);

    await user.click(screen.getByRole("button", { name: "1" }));

    expect(visibleStepLabel(container)).toHaveTextContent(
      `Step 1 of ${LIFECYCLE.length}`,
    );
    expect(
      screen.getByRole("heading", { name: LIFECYCLE[0]!.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(LIFECYCLE[0]!.description)).toBeInTheDocument();
  });

  it("labels the failure step as a failure path", async () => {
    const user = userEvent.setup();
    const { container } = render(<ArchitectureExplorer />);

    const errorIndex = LIFECYCLE.findIndex((s) => s.isErrorPath);
    expect(errorIndex).toBeGreaterThan(-1);

    await user.click(screen.getByRole("button", { name: String(errorIndex + 1) }));
    expect(visibleStepLabel(container)).toHaveTextContent(/failure path/i);
  });

  it("toggles a step off when its number is clicked again", async () => {
    const user = userEvent.setup();
    const { container } = render(<ArchitectureExplorer />);

    const one = screen.getByRole("button", { name: "1" });
    await user.click(one);
    expect(visibleStepLabel(container)).toHaveTextContent("Step 1 of");

    await user.click(one);
    expect(visibleStepLabel(container)).toBeNull();
  });

  it("announces the current step in a live region", async () => {
    const user = userEvent.setup();
    const { container } = render(<ArchitectureExplorer />);

    await user.click(screen.getByRole("button", { name: "2" }));

    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toHaveTextContent(LIFECYCLE[1]!.title);
  });

  it("offers a clear control once a step is showing", async () => {
    const user = userEvent.setup();
    const { container } = render(<ArchitectureExplorer />);

    expect(screen.queryByRole("button", { name: /^Clear$/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "3" }));

    await user.click(screen.getByRole("button", { name: /^Clear$/ }));
    expect(visibleStepLabel(container)).toBeNull();
  });
});

describe("ArchitectureExplorer — confidentiality", () => {
  it("labels the diagram as generic and not internal", () => {
    render(<ArchitectureExplorer />);
    const badge = screen.getByText(/generic · not internal/);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute(
      "title",
      expect.stringMatching(/not a depiction of any employer's internal/i),
    );
  });

  it("names no specific Account Aggregator, provider or internal identifier", () => {
    const { container } = render(<ArchitectureExplorer />);
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
      expect(text, `must not name "${forbidden}"`).not.toContain(forbidden);
    }
  });

  it("exposes no hostname, endpoint path or port anywhere", () => {
    const { container } = render(<ArchitectureExplorer />);
    const text = container.textContent ?? "";

    expect(text).not.toMatch(/https?:\/\//);
    expect(text).not.toMatch(/\/api\/v\d/);
    expect(text).not.toMatch(/:\d{4,5}\b/);
  });

  it("keeps the component vocabulary generic", () => {
    render(<ArchitectureExplorer />);
    // Every node label should be a role, not a product or service name.
    for (const node of ARCH_NODES) {
      expect(node.label).toMatch(
        /gateway|service|adapter|aggregator|provider|application|postgresql|cache|observability/i,
      );
    }
  });
});

describe("architecture data integrity", () => {
  it("every edge connects two declared nodes", () => {
    const ids = new Set(ARCH_NODES.map((n) => n.id));
    for (const edge of ARCH_EDGES) {
      expect(ids.has(edge.from), `${edge.id}.from`).toBe(true);
      expect(ids.has(edge.to), `${edge.id}.to`).toBe(true);
    }
  });

  it("every lifecycle step references declared nodes and edges", () => {
    const nodeIds = new Set(ARCH_NODES.map((n) => n.id));
    const edgeIds = new Set(ARCH_EDGES.map((e) => e.id));

    for (const step of LIFECYCLE) {
      for (const id of step.nodes) {
        expect(nodeIds.has(id), `${step.id} -> node ${id}`).toBe(true);
      }
      for (const id of step.edges) {
        expect(edgeIds.has(id), `${step.id} -> edge ${id}`).toBe(true);
      }
    }
  });

  it("has unique node and edge ids", () => {
    expect(new Set(ARCH_NODES.map((n) => n.id)).size).toBe(ARCH_NODES.length);
    expect(new Set(ARCH_EDGES.map((e) => e.id)).size).toBe(ARCH_EDGES.length);
  });

  it("includes exactly one failure-path step", () => {
    expect(LIFECYCLE.filter((s) => s.isErrorPath)).toHaveLength(1);
  });

  it("keeps every node inside the viewBox", () => {
    for (const node of ARCH_NODES) {
      expect(node.x, node.id).toBeGreaterThanOrEqual(0);
      expect(node.y, node.id).toBeGreaterThanOrEqual(0);
      expect(node.x + node.w, node.id).toBeLessThanOrEqual(1000);
      expect(node.y + node.h, node.id).toBeLessThanOrEqual(500);
    }
  });

  it("gives every node a caption and at least one paragraph of detail", () => {
    for (const node of ARCH_NODES) {
      expect(node.caption.trim(), node.id).not.toBe("");
      expect(node.detail.length, node.id).toBeGreaterThan(0);
    }
  });
});

describe("ArchitectureExplorer — instructions", () => {
  it("tells the visitor how to operate it", () => {
    const { container } = render(<ArchitectureExplorer />);
    expect(within(container).getByText(/arrow keys/i)).toBeInTheDocument();
  });
});
