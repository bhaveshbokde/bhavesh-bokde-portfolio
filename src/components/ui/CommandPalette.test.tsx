import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandPalette, type Command } from "./CommandPalette";
import { routerMock } from "../../../vitest.setup";

/**
 * A command palette lives or dies on its keyboard behaviour, so that is what
 * most of this file checks: the shortcut, arrow navigation that keeps the
 * caret in the input, Escape, focus restoration, and the ARIA wiring that
 * makes any of it legible to a screen reader.
 */

const commands: Command[] = [
  { id: "about", label: "About", icon: "Info", group: "Jump to", href: "#about" },
  { id: "projects", label: "Projects", icon: "Boxes", group: "Jump to", href: "#projects" },
  {
    id: "finsight",
    label: "FinSight",
    keywords: "Java Kafka",
    icon: "Code2",
    group: "Projects",
    href: "/projects/finsight",
  },
  {
    id: "resume",
    label: "Download resume",
    icon: "Download",
    group: "Actions",
    href: "/resume/cv.pdf",
    download: "cv.pdf",
  },
  {
    id: "github",
    label: "GitHub",
    icon: "GitHub",
    group: "Elsewhere",
    href: "https://github.com/bhaveshbokde",
    external: true,
  },
];

function setup() {
  const user = userEvent.setup();
  render(<CommandPalette commands={commands} />);
  return user;
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.keyboard("{Control>}k{/Control}");
  return screen.getByRole("dialog");
}

describe("CommandPalette — opening and closing", () => {
  it("is closed until asked for", () => {
    render(<CommandPalette commands={commands} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on Ctrl+K", async () => {
    const user = setup();
    await open(user);
    expect(screen.getByRole("dialog", { name: /command palette/i })).toBeInTheDocument();
  });

  it("opens on Cmd+K for Apple keyboards", async () => {
    const user = setup();
    await user.keyboard("{Meta>}k{/Meta}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("toggles shut on a second Ctrl+K", async () => {
    const user = setup();
    await open(user);
    await user.keyboard("{Control>}k{/Control}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("opens on a bare slash", async () => {
    const user = setup();
    await user.keyboard("/");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not hijack slash while typing in the palette", async () => {
    const user = setup();
    await open(user);
    const input = screen.getByRole("combobox");
    await user.type(input, "a/b");
    expect(input).toHaveValue("a/b");
  });

  it("closes on Escape", async () => {
    const user = setup();
    await open(user);
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("opens from the visible trigger too, so it is discoverable", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: /open command palette/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("returns focus to the trigger after closing", async () => {
    const user = setup();
    const trigger = screen.getByRole("button", { name: /open command palette/i });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("locks body scroll while open and restores it after", async () => {
    const user = setup();
    await open(user);
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(document.body.style.overflow).not.toBe("hidden");
    });
  });
});

describe("CommandPalette — ARIA wiring", () => {
  it("focuses the input and exposes it as a combobox", async () => {
    const user = setup();
    await open(user);
    const input = screen.getByRole("combobox", { name: /search commands/i });
    await waitFor(() => expect(input).toHaveFocus());
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveAttribute("aria-controls", "command-list");
  });

  it("marks exactly one option selected and points aria-activedescendant at it", async () => {
    const user = setup();
    await open(user);

    const selected = screen.getAllByRole("option").filter(
      (o) => o.getAttribute("aria-selected") === "true",
    );
    expect(selected).toHaveLength(1);
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-activedescendant",
      selected[0]!.id,
    );
  });

  it("keeps the caret in the input while arrowing — focus never moves to the list", async () => {
    const user = setup();
    await open(user);
    const input = screen.getByRole("combobox");

    await user.keyboard("{ArrowDown}");
    expect(input).toHaveFocus();

    const selected = screen
      .getAllByRole("option")
      .filter((o) => o.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
    expect(input).toHaveAttribute("aria-activedescendant", selected[0]!.id);
  });

  it("renders every command, grouped", async () => {
    const user = setup();
    await open(user);
    expect(screen.getAllByRole("option")).toHaveLength(commands.length);
  });
});

describe("CommandPalette — navigation", () => {
  it("moves down and wraps at the end", async () => {
    const user = setup();
    await open(user);

    for (let i = 0; i < commands.length; i += 1) {
      await user.keyboard("{ArrowDown}");
    }
    // Wrapped all the way round to the first option.
    const selected = screen
      .getAllByRole("option")
      .filter((o) => o.getAttribute("aria-selected") === "true");
    expect(selected[0]!.id).toBe("cmd-about");
  });

  it("ArrowUp from the first option wraps to the last", async () => {
    const user = setup();
    await open(user);
    await user.keyboard("{ArrowUp}");

    const selected = screen
      .getAllByRole("option")
      .filter((o) => o.getAttribute("aria-selected") === "true");
    expect(selected[0]!.id).toBe("cmd-github");
  });

  it("Home and End jump to the ends", async () => {
    const user = setup();
    await open(user);

    await user.keyboard("{End}");
    let selected = screen
      .getAllByRole("option")
      .filter((o) => o.getAttribute("aria-selected") === "true");
    expect(selected[0]!.id).toBe("cmd-github");

    await user.keyboard("{Home}");
    selected = screen
      .getAllByRole("option")
      .filter((o) => o.getAttribute("aria-selected") === "true");
    expect(selected[0]!.id).toBe("cmd-about");
  });
});

describe("CommandPalette — filtering", () => {
  it("narrows as you type", async () => {
    const user = setup();
    await open(user);
    await user.type(screen.getByRole("combobox"), "finsight");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("FinSight");
  });

  it("matches on keywords, not just the label", async () => {
    const user = setup();
    await open(user);
    await user.type(screen.getByRole("combobox"), "kafka");

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option")).toHaveTextContent("FinSight");
  });

  it("matches a subsequence, so short abbreviations work", async () => {
    const user = setup();
    await open(user);
    await user.type(screen.getByRole("combobox"), "dres");

    expect(screen.getByRole("option")).toHaveTextContent("Download resume");
  });

  it("says so when nothing matches, rather than showing an empty box", async () => {
    const user = setup();
    await open(user);
    await user.type(screen.getByRole("combobox"), "zzzzzz");

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText(/nothing matches/i)).toBeInTheDocument();
  });

  it("reports the result count in a live region", async () => {
    const user = setup();
    await open(user);
    await user.type(screen.getByRole("combobox"), "finsight");
    expect(screen.getByText("1 result")).toBeInTheDocument();
  });

  it("does not leave the highlight pointing past the end of a shrunken list", async () => {
    const user = setup();
    await open(user);

    await user.keyboard("{End}"); // highlight the last of five
    await user.type(screen.getByRole("combobox"), "finsight"); // now only one

    const selected = screen
      .getAllByRole("option")
      .filter((o) => o.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent("FinSight");
  });
});

describe("CommandPalette — running commands", () => {
  it("routes to an internal page and closes", async () => {
    const user = setup();
    await open(user);
    await user.click(screen.getByRole("option", { name: /FinSight/ }));

    expect(routerMock.push).toHaveBeenCalledWith("/projects/finsight");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("runs the highlighted command on Enter", async () => {
    const user = setup();
    await open(user);
    await user.type(screen.getByRole("combobox"), "finsight");
    await user.keyboard("{Enter}");

    expect(routerMock.push).toHaveBeenCalledWith("/projects/finsight");
  });

  it("opens an external link in a new tab with noopener", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const user = setup();
    await open(user);

    await user.click(screen.getByRole("option", { name: /GitHub/ }));

    expect(openSpy).toHaveBeenCalledWith(
      "https://github.com/bhaveshbokde",
      "_blank",
      "noopener,noreferrer",
    );
    expect(routerMock.push).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("triggers a real download rather than navigating", async () => {
    const clickSpy = vi.fn();
    const originalCreate = document.createElement.bind(document);
    const createSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        const element = originalCreate(tag);
        if (tag === "a") element.click = clickSpy;
        return element;
      });

    const user = setup();
    await open(user);
    await user.click(screen.getByRole("option", { name: /Download resume/ }));

    expect(clickSpy).toHaveBeenCalled();
    expect(routerMock.push).not.toHaveBeenCalled();
    createSpy.mockRestore();
  });

  it("scrolls to an in-page anchor instead of routing", async () => {
    const target = document.createElement("div");
    target.id = "about";
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);

    const user = setup();
    await open(user);
    await user.click(screen.getByRole("option", { name: "About" }));

    await waitFor(() => {
      expect(target.scrollIntoView).toHaveBeenCalled();
    });
    expect(routerMock.push).not.toHaveBeenCalled();

    target.remove();
  });
});

describe("CommandPalette — match precision", () => {
  it("typing a project's exact name returns only that project", async () => {
    const noisy: Command[] = [
      ...commands,
      {
        id: "notification",
        label: "Notification Service",
        // The kind of long stack blob that a subsequence matcher swallows
        // whole: "finsight" is a subsequence of this string.
        keywords: "Asynchronous messaging Java Spring Boot Flyway JUnit Testcontainers JaCoCo",
        icon: "Code2",
        group: "Projects",
        href: "/projects/notification-service",
      },
    ];

    const user = userEvent.setup();
    render(<CommandPalette commands={noisy} />);
    await user.keyboard("{Control>}k{/Control}");
    await user.type(screen.getByRole("combobox"), "finsight");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("FinSight");
  });

  it("still matches keywords by substring", async () => {
    const user = userEvent.setup();
    render(<CommandPalette commands={commands} />);
    await user.keyboard("{Control>}k{/Control}");
    await user.type(screen.getByRole("combobox"), "kafka");

    expect(screen.getByRole("option")).toHaveTextContent("FinSight");
  });
});
