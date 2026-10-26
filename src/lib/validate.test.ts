import { describe, expect, it } from "vitest";
import {
  assertContentIsValid,
  defaultContent,
  validateContent,
  type ContentBundle,
} from "./validate";
import type { Project, Skill } from "@/data/types";

/**
 * The validator's job is to turn a typo in `src/data/` into a build failure
 * that names the file and the entry. These tests check both halves of that:
 * the real content passes, and each rule actually fires when broken.
 */

/** A copy of the real content with one slice swapped out. */
function withOverrides(overrides: Partial<ContentBundle>): ContentBundle {
  return { ...defaultContent, ...overrides };
}

describe("the site's real content", () => {
  it("passes validation", () => {
    const issues = validateContent();
    expect(
      issues,
      `Content issues:\n${issues.map((i) => `  [${i.source}] ${i.message}`).join("\n")}`,
    ).toEqual([]);
  });

  it("does not throw from assertContentIsValid", () => {
    expect(() => assertContentIsValid()).not.toThrow();
  });
});

describe("skill rules", () => {
  it("rejects a skill pointing at a category that does not exist", () => {
    const skills: Skill[] = [
      { id: "kafka", name: "Apache Kafka", category: "nonexistent" },
    ];
    const issues = validateContent(withOverrides({ skills }));

    expect(issues).toHaveLength(1);
    expect(issues[0]?.source).toBe("src/data/skills.ts");
    expect(issues[0]?.message).toContain("kafka");
    expect(issues[0]?.message).toContain("nonexistent");
    // The message should tell you what the valid options are.
    expect(issues[0]?.message).toContain("backend");
  });

  it("rejects duplicate skill ids", () => {
    const skills: Skill[] = [
      { id: "java", name: "Java", category: "backend" },
      { id: "java", name: "Java (again)", category: "backend" },
    ];
    const messages = validateContent(withOverrides({ skills })).map((i) => i.message);
    expect(messages.some((m) => m.includes('Duplicate skill id "java"'))).toBe(true);
  });

  it("rejects an empty skill name", () => {
    const skills: Skill[] = [{ id: "blank", name: "   ", category: "backend" }];
    const messages = validateContent(withOverrides({ skills })).map((i) => i.message);
    expect(messages.some((m) => m.includes("empty name"))).toBe(true);
  });

  it("accepts a minimal skill with every optional field omitted", () => {
    const skills: Skill[] = [{ id: "minimal", name: "Minimal", category: "backend" }];
    expect(validateContent(withOverrides({ skills }))).toEqual([]);
  });
});

describe("project rules", () => {
  const base: Project = {
    slug: "example",
    name: "Example",
    kind: "independent",
    status: "complete",
    category: "Backend service",
    summary: "A summary.",
    stack: ["Java"],
  };

  it("accepts a minimal project with every optional field omitted", () => {
    expect(validateContent(withOverrides({ projects: [base] }))).toEqual([]);
  });

  it("rejects duplicate slugs, because slugs are URLs", () => {
    const projects = [base, { ...base, name: "Clash" }];
    const messages = validateContent(withOverrides({ projects })).map((i) => i.message);
    expect(messages.some((m) => m.includes("Duplicate project slug"))).toBe(true);
  });

  it("rejects a slug that would not survive being a URL", () => {
    const projects = [{ ...base, slug: "Not A Slug" }];
    const messages = validateContent(withOverrides({ projects })).map((i) => i.message);
    expect(messages.some((m) => m.includes("kebab-case"))).toBe(true);
  });

  it("requires a confidentiality note on professional work", () => {
    const projects: Project[] = [{ ...base, kind: "professional" }];
    const messages = validateContent(withOverrides({ projects })).map((i) => i.message);
    expect(messages.some((m) => m.includes("confidentialityNote"))).toBe(true);
  });

  it("accepts professional work that carries the note", () => {
    const projects: Project[] = [
      { ...base, kind: "professional", confidentialityNote: "Described, not published." },
    ];
    expect(validateContent(withOverrides({ projects }))).toEqual([]);
  });

  it("requires alt text whenever a preview image is set", () => {
    const projects: Project[] = [{ ...base, preview: "/projects/example.svg" }];
    const messages = validateContent(withOverrides({ projects })).map((i) => i.message);
    expect(messages.some((m) => m.includes("previewAlt"))).toBe(true);
  });

  it("rejects an empty stack", () => {
    const projects: Project[] = [{ ...base, stack: [] }];
    const messages = validateContent(withOverrides({ projects })).map((i) => i.message);
    expect(messages.some((m) => m.includes("empty stack"))).toBe(true);
  });

  it("allows a link with no url — that is the 'not configured yet' case", () => {
    const projects: Project[] = [
      { ...base, links: [{ label: "Repository", kind: "repository" }] },
    ];
    expect(validateContent(withOverrides({ projects }))).toEqual([]);
  });

  it("rejects a link whose url is not a url", () => {
    const projects: Project[] = [
      { ...base, links: [{ label: "Repository", url: "github dot com", kind: "repository" }] },
    ];
    const messages = validateContent(withOverrides({ projects })).map((i) => i.message);
    expect(messages.some((m) => m.includes("suspicious url"))).toBe(true);
  });

  it("rejects an empty case-study section", () => {
    const projects: Project[] = [
      { ...base, caseStudy: [{ id: "hollow", heading: "Hollow" }] },
    ];
    const messages = validateContent(withOverrides({ projects })).map((i) => i.message);
    expect(messages.some((m) => m.includes("neither body nor bullets"))).toBe(true);
  });
});

describe("experience rules", () => {
  it("rejects a malformed start date", () => {
    const experience = [
      { ...defaultContent.experience[0]!, id: "x", startDate: "Sep 2022" },
    ];
    const messages = validateContent(withOverrides({ experience })).map((i) => i.message);
    expect(messages.some((m) => m.includes("startDate"))).toBe(true);
  });

  it("rejects a role that ends before it starts", () => {
    const experience = [
      { ...defaultContent.experience[0]!, id: "x", startDate: "2022-09", endDate: "2021-01" },
    ];
    const messages = validateContent(withOverrides({ experience })).map((i) => i.message);
    expect(messages.some((m) => m.includes("ends before it starts"))).toBe(true);
  });

  it("treats a missing endDate as current, not as an error", () => {
    const first = defaultContent.experience[0]!;
    const { endDate: _omitted, ...withoutEnd } = first;
    expect(validateContent(withOverrides({ experience: [withoutEnd] }))).toEqual([]);
  });

  it("rejects a role with no highlights", () => {
    const experience = [{ ...defaultContent.experience[0]!, highlights: [] }];
    const messages = validateContent(withOverrides({ experience })).map((i) => i.message);
    expect(messages.some((m) => m.includes("no highlights"))).toBe(true);
  });
});

describe("site config rules", () => {
  it("rejects a resume path that is not a public path", () => {
    const siteConfig = { ...defaultContent.siteConfig, resumePath: "resume.pdf" };
    const messages = validateContent(withOverrides({ siteConfig })).map((i) => i.message);
    expect(messages.some((m) => m.includes("resumePath"))).toBe(true);
  });

  it("rejects an empty sections list", () => {
    const siteConfig = { ...defaultContent.siteConfig, sections: [] };
    const messages = validateContent(withOverrides({ siteConfig })).map((i) => i.message);
    expect(messages.some((m) => m.includes("sections"))).toBe(true);
  });
});

describe("assertContentIsValid", () => {
  it("throws a message that names the file and the problem", () => {
    const broken = withOverrides({
      skills: [{ id: "x", name: "X", category: "nope" }],
    });

    expect(() => assertContentIsValid(broken)).toThrow(/src\/data\/skills\.ts/);
    expect(() => assertContentIsValid(broken)).toThrow(/nope/);
  });

  it("reports every issue at once rather than stopping at the first", () => {
    const broken = withOverrides({
      skills: [
        { id: "a", name: "A", category: "nope" },
        { id: "a", name: "A again", category: "backend" },
      ],
    });
    expect(() => assertContentIsValid(broken)).toThrow(/2 issue\(s\)/);
  });
});
