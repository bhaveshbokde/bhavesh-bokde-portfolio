import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SkillsExplorer } from "./SkillsExplorer";
import type { SkillsExplorerGroup } from "./SkillsExplorer";

/**
 * The point of these tests is the claim in the README: adding, removing or
 * renaming a skill is a change to one data file and nothing else. That only
 * holds if the filter chips and counts are derived from the data rather than
 * written down somewhere in a component — so that is what is asserted here.
 */

const groups: SkillsExplorerGroup[] = [
  {
    category: { id: "backend", label: "Backend", icon: "Server", description: "Services." },
    skills: [
      { id: "java", name: "Java", category: "backend", usedInProduction: true, projects: [{ slug: "finsight", name: "FinSight" }] },
      { id: "spring", name: "Spring Boot", category: "backend", usedInProduction: true, projects: [] },
      { id: "hibernate", name: "Hibernate", category: "backend", projects: [] },
    ],
  },
  {
    category: { id: "databases", label: "Databases" },
    skills: [{ id: "postgres", name: "PostgreSQL", category: "databases", projects: [] }],
  },
];

describe("SkillsExplorer", () => {
  it("builds one filter chip per category, plus All", () => {
    render(<SkillsExplorer groups={groups} />);
    const chips = screen.getAllByRole("radio");
    expect(chips.map((chip) => chip.textContent)).toEqual([
      "All4",
      "Backend3",
      "Databases1",
    ]);
  });

  it("counts come from the data, not from a hardcoded number", () => {
    const extended: SkillsExplorerGroup[] = [
      {
        ...groups[0]!,
        skills: [...groups[0]!.skills, { id: "jpa", name: "JPA", category: "backend", projects: [] }],
      },
      groups[1]!,
    ];
    render(<SkillsExplorer groups={extended} />);
    expect(screen.getByRole("radio", { name: /^All/ })).toHaveTextContent("All5");
    expect(screen.getByRole("radio", { name: /^Backend/ })).toHaveTextContent("Backend4");
  });

  it("starts on All with every skill visible", () => {
    render(<SkillsExplorer groups={groups} />);
    expect(screen.getByRole("radio", { name: /^All/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByText("Java")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
  });

  it("filters to one category when its chip is chosen", async () => {
    const user = userEvent.setup();
    render(<SkillsExplorer groups={groups} />);

    await user.click(screen.getByRole("radio", { name: /^Databases/ }));

    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
    expect(screen.queryByText("Java")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^Databases/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("returns to showing everything when All is chosen again", async () => {
    const user = userEvent.setup();
    render(<SkillsExplorer groups={groups} />);

    await user.click(screen.getByRole("radio", { name: /^Databases/ }));
    await user.click(screen.getByRole("radio", { name: /^All/ }));

    expect(screen.getByText("Java")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
  });

  it("exposes the filter as a labelled radio group for assistive technology", () => {
    render(<SkillsExplorer groups={groups} />);
    expect(
      screen.getByRole("radiogroup", { name: /filter skills by category/i }),
    ).toBeInTheDocument();
  });

  it("is operable by keyboard", async () => {
    const user = userEvent.setup();
    render(<SkillsExplorer groups={groups} />);

    await user.tab();
    expect(screen.getByRole("radio", { name: /^All/ })).toHaveFocus();

    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("radio", { name: /^Backend/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("marks production-used skills and leaves the rest unclaimed", () => {
    render(<SkillsExplorer groups={groups} />);
    expect(screen.getByText("Java").closest("span")).toHaveAttribute(
      "title",
      expect.stringContaining("Used in production"),
    );
    // Hibernate has no description, proficiency or production marker, so it
    // should carry no title at all rather than an empty one.
    expect(screen.getByText("Hibernate").closest("span")).not.toHaveAttribute("title");
  });

  it("renders no percentage, rating or progress bar anywhere", () => {
    const { container } = render(<SkillsExplorer groups={groups} />);
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(container.querySelector("progress")).toBeNull();
    expect(container.textContent).not.toMatch(/\d+\s*%/);
  });

  it("renders a category with no description without leaving a gap", () => {
    render(<SkillsExplorer groups={[groups[1]!]} />);
    expect(screen.getByRole("heading", { name: "Databases" })).toBeInTheDocument();
  });
});
