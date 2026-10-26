import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./Header";
import type { NavItem } from "@/data/types";

/**
 * The mobile menu is where keyboard support usually gets quietly dropped, so
 * most of these tests are about focus: where it goes when the panel opens,
 * where it comes back to when it closes, and whether Tab can escape into the
 * page hidden behind the overlay.
 */

const navItems: NavItem[] = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
];

function renderHeader() {
  return render(
    <Header
      monogram="BB"
      name="Bhavesh Bokde"
      navItems={navItems}
      resumePath="/resume/cv.pdf"
      resumeDownloadName="cv.pdf"
    />,
  );
}

describe("Header — structure", () => {
  it("renders a primary navigation landmark with every configured item", () => {
    renderHeader();
    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const item of navItems) {
      expect(nav).toContainElement(screen.getAllByRole("link", { name: item.label })[0]!);
    }
  });

  it("renders the nav from the data it is given, not a hardcoded list", () => {
    render(
      <Header
        monogram="XY"
        name="Someone Else"
        navItems={[{ label: "Writing", href: "#writing" }]}
        resumePath="/resume/cv.pdf"
        resumeDownloadName="cv.pdf"
      />,
    );
    expect(screen.getByRole("link", { name: "Writing" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "About" })).not.toBeInTheDocument();
  });

  it("links home from the monogram", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: /Bhavesh Bokde — home/ })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("offers the resume as a real download with the configured filename", () => {
    renderHeader();
    const resume = screen.getAllByRole("link", { name: /resume/i })[0]!;
    expect(resume).toHaveAttribute("href", "/resume/cv.pdf");
    expect(resume).toHaveAttribute("download", "cv.pdf");
  });
});

describe("Header — mobile menu", () => {
  it("starts closed", () => {
    renderHeader();
    const toggle = screen.getByRole("button", { name: /open menu/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("wires aria-controls to the panel it governs", async () => {
    const user = userEvent.setup();
    renderHeader();

    const toggle = screen.getByRole("button", { name: /open menu/i });
    expect(toggle).toHaveAttribute("aria-controls", "mobile-menu");

    await user.click(toggle);
    expect(screen.getByRole("dialog")).toHaveAttribute("id", "mobile-menu");
  });

  it("opens, announces its state, and moves focus into the panel", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: /close menu/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  it("closes on Escape and returns focus to the toggle", async () => {
    const user = userEvent.setup();
    renderHeader();

    const toggle = screen.getByRole("button", { name: /open menu/i });
    await user.click(toggle);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /open menu/i })).toHaveFocus();
  });

  it("closes when a navigation link inside it is followed", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    const dialog = screen.getByRole("dialog");
    await user.click(
      screen.getAllByRole("link", { name: "About" }).find((link) => dialog.contains(link))!,
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("locks body scroll while open and restores it on close", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(document.body.style.overflow).not.toBe("hidden");
    });
  });

  it("traps Tab inside the panel so focus cannot wander behind the overlay", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    const dialog = screen.getByRole("dialog");

    // Tab well past the number of focusable elements in the panel; focus must
    // still be inside it.
    for (let i = 0; i < 10; i += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("wraps backwards too", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    const dialog = screen.getByRole("dialog");

    await user.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("offers the resume download inside the panel as well", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    const dialog = screen.getByRole("dialog");
    const download = screen.getByRole("link", { name: /download resume/i });

    expect(dialog).toContainElement(download);
    expect(download).toHaveAttribute("download", "cv.pdf");
  });
});
