import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "./Hero";
import { profile } from "@/data/profile";
import { siteConfig } from "@/data/site-config";

describe("Hero", () => {
  it("renders the name and title as the page's heading", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(profile.name);
    expect(heading).toHaveTextContent(profile.title);
  });

  it("renders the summary with the years placeholder resolved", () => {
    render(<Hero />);
    expect(screen.queryByText(/\{\{years\}\}/)).not.toBeInTheDocument();
    expect(screen.getByText(/years of experience/i)).toBeInTheDocument();
  });

  it("offers the three calls to action the brief asks for", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: /view projects/i })).toHaveAttribute(
      "href",
      "#projects",
    );
    expect(screen.getByRole("link", { name: /experience/i })).toHaveAttribute(
      "href",
      "#experience",
    );
    expect(screen.getByRole("link", { name: /résumé/i })).toHaveAttribute(
      "href",
      siteConfig.resumePath,
    );
  });

  it("serves the resume as a download rather than a navigation", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: /résumé/i })).toHaveAttribute(
      "download",
      siteConfig.resumeDownloadName,
    );
  });

  it("links GitHub and LinkedIn, opening them safely", () => {
    render(<Hero />);

    const github = screen.getByRole("link", { name: /GitHub/i });
    expect(github).toHaveAttribute("href", "https://github.com/bhaveshbokde");
    expect(github).toHaveAttribute("rel", expect.stringContaining("noopener"));

    const linkedin = screen.getByRole("link", { name: /LinkedIn/i });
    expect(linkedin).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/bhavesh-bokde",
    );
    expect(linkedin).toHaveAttribute("target", "_blank");
  });

  it("warns screen reader users that social links open a new tab", () => {
    render(<Hero />);
    const warned = screen.getAllByRole("link", { name: /opens in a new tab/i });
    // Both GitHub and LinkedIn leave the site, so both must say so.
    expect(warned.length).toBeGreaterThanOrEqual(2);
  });

  it("states the location", () => {
    render(<Hero />);
    expect(screen.getByText(profile.location)).toBeInTheDocument();
  });

  it("carries no fabricated statistics, logos or testimonials", () => {
    const { container } = render(<Hero />);
    const text = container.textContent ?? "";

    expect(text).not.toMatch(/\d+\+?\s*(clients|customers|companies|projects delivered)/i);
    expect(text).not.toMatch(/testimonial/i);
    expect(text).not.toMatch(/trusted by/i);
    expect(text).not.toMatch(/\b(ninja|rockstar|guru|10x)\b/i);
  });

  it("gives the hero visual an accessible description of what it depicts", () => {
    render(<Hero />);
    const visual = screen.getByRole("img", { name: /request path|backend request/i });
    expect(visual).toBeInTheDocument();
    // It should describe the system, not just say "diagram".
    expect(visual.getAttribute("aria-label")).toMatch(/cache|PostgreSQL|API/i);
  });

  it("offers a working scroll cue rather than a decorative arrow", () => {
    render(<Hero />);
    const cue = screen.getByRole("link", { name: /scroll to the about section/i });
    expect(cue).toHaveAttribute("href", "#about");
  });
});
