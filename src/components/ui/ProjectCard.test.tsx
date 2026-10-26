import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/data/types";

/**
 * The card has to survive being handed an almost-empty project, because every
 * field except the six required ones is optional in `src/data/projects.ts`.
 * These tests are what keeps that promise true.
 */

const minimal: Project = {
  slug: "minimal",
  name: "Minimal Project",
  kind: "independent",
  status: "in-development",
  category: "Backend service",
  summary: "The smallest project the type system allows.",
  stack: ["Java"],
};

const full: Project = {
  ...minimal,
  slug: "full",
  name: "Full Project",
  status: "complete",
  stack: ["Java", "Spring Boot", "PostgreSQL", "Redis", "Kafka", "Docker", "Flyway"],
  metrics: [
    { label: "Tests", value: "336 passing", source: "unit + integration" },
    { label: "Coverage", value: "80.9%", source: "JaCoCo" },
    { label: "Endpoints", value: "38", source: "docs" },
  ],
  links: [
    { label: "Repository", url: "https://github.com/example/repo", kind: "repository" },
    { label: "Demo", url: "https://example.com", kind: "demo" },
  ],
  preview: "/projects/finsight.svg",
  previewAlt: "A diagram of the pipeline",
  caseStudy: [{ id: "one", heading: "One", body: ["Body."] }],
};

describe("ProjectCard with only the required fields", () => {
  it("renders without throwing", () => {
    expect(() => render(<ProjectCard project={minimal} />)).not.toThrow();
  });

  it("shows the name, category and summary", () => {
    render(<ProjectCard project={minimal} />);
    expect(screen.getByText("Minimal Project")).toBeInTheDocument();
    expect(screen.getByText("Backend service")).toBeInTheDocument();
    expect(screen.getByText(/smallest project/i)).toBeInTheDocument();
  });

  it("links to its detail page", () => {
    render(<ProjectCard project={minimal} />);
    expect(screen.getByRole("link", { name: "Minimal Project" })).toHaveAttribute(
      "href",
      "/projects/minimal",
    );
  });

  it("renders a typographic panel instead of a broken image when there is no preview", () => {
    render(<ProjectCard project={minimal} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders no repository or demo link when none is configured", () => {
    render(<ProjectCard project={minimal} />);
    expect(screen.queryByRole("link", { name: /repository/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /demo/i })).not.toBeInTheDocument();
  });

  it("renders no metrics block when there are no metrics", () => {
    const { container } = render(<ProjectCard project={minimal} />);
    expect(container.querySelector("dl")).toBeNull();
  });

  it("states the in-development status honestly", () => {
    render(<ProjectCard project={minimal} />);
    expect(screen.getByText("In development")).toBeInTheDocument();
    expect(screen.queryByText("Complete")).not.toBeInTheDocument();
  });

  it("says 'View details' rather than 'Read case study' without a case study", () => {
    render(<ProjectCard project={minimal} />);
    expect(screen.getByText("View details")).toBeInTheDocument();
  });
});

describe("ProjectCard with every field populated", () => {
  it("renders the preview image with its alt text", () => {
    render(<ProjectCard project={full} />);
    expect(screen.getByAltText("A diagram of the pipeline")).toBeInTheDocument();
  });

  it("opens external links safely in a new tab", () => {
    render(<ProjectCard project={full} />);
    const repository = screen.getByRole("link", { name: /repository on GitHub/i });
    expect(repository).toHaveAttribute("href", "https://github.com/example/repo");
    expect(repository).toHaveAttribute("target", "_blank");
    expect(repository).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(repository).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  });

  it("shows a live demo link when one genuinely exists", () => {
    render(<ProjectCard project={full} />);
    expect(screen.getByRole("link", { name: /live demo/i })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });

  it("caps the visible stack and shows the remainder as a count", () => {
    render(<ProjectCard project={full} />);
    expect(screen.getByText("Java")).toBeInTheDocument();
    // 7 technologies, 5 shown, so "+2".
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("shows metrics with their source available on hover", () => {
    render(<ProjectCard project={full} />);
    const value = screen.getByText("336 passing");
    expect(value).toHaveAttribute("title", "unit + integration");
  });

  it("says 'Read case study' when there is one", () => {
    render(<ProjectCard project={full} />);
    expect(screen.getByText("Read case study")).toBeInTheDocument();
  });
});

describe("ProjectCard kind labelling", () => {
  it("labels employer-owned work as professional", () => {
    const professional: Project = {
      ...minimal,
      kind: "professional",
      confidentialityNote: "Described, not published.",
    };
    const { container } = render(<ProjectCard project={professional} />);
    expect(within(container).getByText("Professional")).toBeInTheDocument();
  });

  it("labels personal repositories as independent", () => {
    render(<ProjectCard project={minimal} />);
    expect(screen.getByText("Independent")).toBeInTheDocument();
  });
});
