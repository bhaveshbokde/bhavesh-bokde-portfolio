import { describe, expect, it } from "vitest";

import {
  formatDateRange,
  formatDuration,
  formatMonthYear,
  formatYearsOfExperience,
  getCaseStudyProject,
  getFooterLinks,
  getHeroLinks,
  getProjectBySlug,
  getProjects,
  getSkillGroups,
  interpolate,
  monthsBetween,
  parseIsoMonth,
  visibleSorted,
} from "./content";
import { profile } from "@/data/profile";
import type { Listable } from "@/data/types";

/* ------------------------------------------------------------------ */
/* visibleSorted — the rule every list on the site obeys               */
/* ------------------------------------------------------------------ */

interface Item extends Listable {
  id: string;
}

describe("visibleSorted", () => {
  it("drops entries marked hidden", () => {
    const items: Item[] = [
      { id: "a" },
      { id: "b", hidden: true },
      { id: "c", hidden: false },
    ];
    expect(visibleSorted(items).map((item) => item.id)).toEqual(["a", "c"]);
  });

  it("sorts by order ascending", () => {
    const items: Item[] = [
      { id: "third", order: 3 },
      { id: "first", order: 1 },
      { id: "second", order: 2 },
    ];
    expect(visibleSorted(items).map((item) => item.id)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("puts unordered entries after ordered ones, keeping file order among them", () => {
    const items: Item[] = [
      { id: "loose-1" },
      { id: "pinned", order: 1 },
      { id: "loose-2" },
    ];
    expect(visibleSorted(items).map((item) => item.id)).toEqual([
      "pinned",
      "loose-1",
      "loose-2",
    ]);
  });

  it("is stable for equal order values", () => {
    const items: Item[] = [
      { id: "a", order: 1 },
      { id: "b", order: 1 },
      { id: "c", order: 1 },
    ];
    expect(visibleSorted(items).map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the input array", () => {
    const items: Item[] = [{ id: "b", order: 2 }, { id: "a", order: 1 }];
    visibleSorted(items);
    expect(items.map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("returns an empty array for empty input", () => {
    expect(visibleSorted([])).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

describe("parseIsoMonth", () => {
  it("parses YYYY-MM", () => {
    const date = parseIsoMonth("2022-09");
    expect(date?.getUTCFullYear()).toBe(2022);
    expect(date?.getUTCMonth()).toBe(8);
    expect(date?.getUTCDate()).toBe(1);
  });

  it("parses YYYY-MM-DD", () => {
    expect(parseIsoMonth("2022-09-15")?.getUTCDate()).toBe(15);
  });

  it("returns null rather than an Invalid Date for junk", () => {
    expect(parseIsoMonth("not a date")).toBeNull();
    expect(parseIsoMonth("2022")).toBeNull();
    expect(parseIsoMonth(undefined)).toBeNull();
    expect(parseIsoMonth("")).toBeNull();
  });
});

describe("formatMonthYear", () => {
  it("formats a parseable value", () => {
    expect(formatMonthYear("2022-09")).toBe("Sep 2022");
    expect(formatMonthYear("2017-12-31")).toBe("Dec 2017");
  });

  it("falls back to the raw string rather than printing NaN", () => {
    expect(formatMonthYear("sometime in 2022")).toBe("sometime in 2022");
  });

  it("returns an empty string for undefined", () => {
    expect(formatMonthYear(undefined)).toBe("");
  });
});

describe("formatDateRange", () => {
  it("renders Present when there is no end date", () => {
    expect(formatDateRange("2022-09")).toBe("Sep 2022 – Present");
  });

  it("renders both ends when the role has finished", () => {
    expect(formatDateRange("2013-06", "2017-05")).toBe("Jun 2013 – May 2017");
  });
});

describe("monthsBetween", () => {
  it("counts whole months", () => {
    const from = new Date(Date.UTC(2022, 8, 1));
    const to = new Date(Date.UTC(2026, 10, 1));
    expect(monthsBetween(from, to)).toBe(50);
  });

  it("floors at zero when the dates are the wrong way round", () => {
    const from = new Date(Date.UTC(2026, 0, 1));
    const to = new Date(Date.UTC(2022, 0, 1));
    expect(monthsBetween(from, to)).toBe(0);
  });
});

describe("formatDuration", () => {
  const now = new Date(Date.UTC(2026, 9, 26)); // 26 Oct 2026

  it("renders years and months for a current role", () => {
    expect(formatDuration("2022-09", undefined, now)).toBe("4 yrs 1 mo");
  });

  it("singularises one year", () => {
    expect(formatDuration("2025-10", undefined, now)).toBe("1 yr");
  });

  it("renders months only when under a year", () => {
    expect(formatDuration("2026-07", undefined, now)).toBe("3 mos");
  });

  it("uses the end date when the role has finished, ignoring the clock", () => {
    expect(formatDuration("2013-06", "2017-06", now)).toBe("4 yrs");
  });

  it("returns an empty string for an unparseable start", () => {
    expect(formatDuration("whenever", undefined, now)).toBe("");
  });
});

/* ------------------------------------------------------------------ */
/* Derived years of experience                                         */
/* ------------------------------------------------------------------ */

describe("formatYearsOfExperience", () => {
  it("derives the figure from careerStartDate rather than hardcoding it", () => {
    // profile.careerStartDate is 2022-09.
    expect(formatYearsOfExperience(new Date(Date.UTC(2026, 9, 26)))).toBe("4+");
    expect(formatYearsOfExperience(new Date(Date.UTC(2027, 2, 1)))).toBe("4.5+");
    expect(formatYearsOfExperience(new Date(Date.UTC(2027, 8, 1)))).toBe("5+");
  });

  it("rounds down to the nearest half year — never flatters", () => {
    // 4 years 11 months must not round up to 5.
    expect(formatYearsOfExperience(new Date(Date.UTC(2027, 7, 1)))).toBe("4.5+");
  });

  it("handles the first few months without claiming a year", () => {
    expect(formatYearsOfExperience(new Date(Date.UTC(2022, 10, 1)))).toBe("< 1");
  });

  it("keeps moving as time passes, so the site cannot go stale", () => {
    const earlier = formatYearsOfExperience(new Date(Date.UTC(2026, 9, 26)));
    const later = formatYearsOfExperience(new Date(Date.UTC(2030, 9, 26)));
    expect(earlier).not.toBe(later);
  });
});

describe("interpolate", () => {
  it("substitutes known placeholders", () => {
    expect(interpolate("I have {{years}} years", { years: "4+" })).toBe(
      "I have 4+ years",
    );
  });

  it("leaves unknown placeholders alone instead of blanking them", () => {
    expect(interpolate("Hello {{nobody}}", { years: "4+" })).toBe("Hello {{nobody}}");
  });

  it("the profile summary actually contains the placeholder it relies on", () => {
    expect(profile.summary).toContain("{{years}}");
  });
});

/* ------------------------------------------------------------------ */
/* Content selectors                                                   */
/* ------------------------------------------------------------------ */

describe("getSkillGroups", () => {
  it("groups skills under their category", () => {
    const groups = getSkillGroups();
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      for (const skill of group.skills) {
        expect(skill.category).toBe(group.category.id);
      }
    }
  });

  it("never returns an empty group — an empty category should disappear", () => {
    for (const group of getSkillGroups()) {
      expect(group.skills.length).toBeGreaterThan(0);
    }
  });

  it("accounts for every visible skill exactly once", () => {
    const grouped = getSkillGroups().flatMap((group) => group.skills.map((s) => s.id));
    expect(new Set(grouped).size).toBe(grouped.length);
  });
});

describe("project selectors", () => {
  it("finds a project by slug", () => {
    expect(getProjectBySlug("finsight")?.name).toBe("FinSight");
  });

  it("returns undefined for an unknown slug rather than throwing", () => {
    expect(getProjectBySlug("does-not-exist")).toBeUndefined();
  });

  it("picks the featured professional project as the case study", () => {
    const caseStudy = getCaseStudyProject();
    expect(caseStudy?.kind).toBe("professional");
    expect(caseStudy?.featured).toBe(true);
  });

  it("gives every professional project a confidentiality note", () => {
    for (const project of getProjects()) {
      if (project.kind === "professional") {
        expect(project.confidentialityNote).toBeTruthy();
      }
    }
  });

  it("never marks an in-development project as having a live demo", () => {
    for (const project of getProjects()) {
      if (project.status === "in-development" || project.status === "planned") {
        const demo = project.links?.find((link) => link.kind === "demo");
        expect(demo?.url).toBeUndefined();
      }
    }
  });

  it("gives every metric a source, so no figure is unattributed", () => {
    for (const project of getProjects()) {
      for (const metric of project.metrics ?? []) {
        expect(metric.source, `${project.slug} / ${metric.label}`).toBeTruthy();
      }
    }
  });
});

describe("social link selectors", () => {
  it("hero links are a subset of all links and opt in explicitly", () => {
    for (const link of getHeroLinks()) {
      expect(link.showInHero).toBe(true);
    }
  });

  it("footer links default to shown", () => {
    const ids = getFooterLinks().map((link) => link.id);
    expect(ids).toContain("github");
    expect(ids).toContain("linkedin");
  });
});
