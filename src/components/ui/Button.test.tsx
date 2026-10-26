import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ButtonLink } from "./Button";

/**
 * Every call to action on the site is an anchor, never a `<button>` that
 * navigates. These tests pin the behaviour that follows from that choice.
 */
describe("ButtonLink", () => {
  it("renders an anchor, not a button", () => {
    render(<ButtonLink href="#about">About</ButtonLink>);
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("adds target and rel to external links automatically", () => {
    render(<ButtonLink href="https://example.com">Example</ButtonLink>);
    const link = screen.getByRole("link", { name: "Example" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("leaves internal anchors alone", () => {
    render(<ButtonLink href="#contact">Contact</ButtonLink>);
    const link = screen.getByRole("link", { name: "Contact" });
    expect(link).not.toHaveAttribute("target");
    expect(link).toHaveAttribute("href", "#contact");
  });

  it("passes the download filename through for the resume", () => {
    render(
      <ButtonLink href="/resume/cv.pdf" download="Bhavesh-Bokde.pdf">
        Resume
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "Resume" });
    expect(link).toHaveAttribute("download", "Bhavesh-Bokde.pdf");
    expect(link).toHaveAttribute("href", "/resume/cv.pdf");
    // A download must not open a new tab — that leaves an orphan blank tab.
    expect(link).not.toHaveAttribute("target");
  });

  it("honours an explicit external override", () => {
    render(
      <ButtonLink href="/somewhere" external>
        Elsewhere
      </ButtonLink>,
    );
    expect(screen.getByRole("link", { name: "Elsewhere" })).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  it("routes internal paths through the client-side router", () => {
    render(<ButtonLink href="/projects/finsight">FinSight</ButtonLink>);
    expect(screen.getByRole("link", { name: "FinSight" })).toHaveAttribute(
      "href",
      "/projects/finsight",
    );
  });

  it("handles a mailto href as a plain link", () => {
    render(<ButtonLink href="mailto:someone@example.com">Email</ButtonLink>);
    const link = screen.getByRole("link", { name: "Email" });
    expect(link).toHaveAttribute("href", "mailto:someone@example.com");
    expect(link).not.toHaveAttribute("target");
  });
});
