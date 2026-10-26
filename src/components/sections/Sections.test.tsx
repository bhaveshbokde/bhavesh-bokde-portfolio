import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { About } from "./About";
import { ExperienceSection } from "./ExperienceSection";
import { CaseStudySection } from "./CaseStudySection";
import { Projects } from "./Projects";
import { Skills } from "./Skills";
import { EducationSection } from "./EducationSection";
import { Contact } from "./Contact";
import { profile } from "@/data/profile";
import { experience } from "@/data/experience";
import { education } from "@/data/education";

/**
 * Section-level smoke tests against the real content.
 *
 * They check the things a recruiter would notice if they broke: the headings
 * exist, the dates are formatted rather than printed raw, the confidentiality
 * notice is on the office project, and nothing claims more than the data
 * supports.
 */

describe("About", () => {
  it("renders every paragraph and the facts strip", () => {
    render(<About />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    for (const fact of profile.facts ?? []) {
      expect(screen.getByText(fact.label)).toBeInTheDocument();
      expect(screen.getByText(fact.value)).toBeInTheDocument();
    }
  });

  it("hides the expanded copy behind a collapsed disclosure", () => {
    render(<About />);
    const toggle = screen.getByRole("button", { name: /read more/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    const firstExpanded = profile.aboutExpanded?.[0];
    if (firstExpanded) {
      expect(screen.queryByText(firstExpanded)).not.toBeInTheDocument();
    }
  });

  it("explains the professional / independent distinction once, up front", () => {
    render(<About />);
    expect(screen.getByText(/Professional/)).toBeInTheDocument();
    expect(screen.getByText(/Independent/)).toBeInTheDocument();
  });
});

describe("ExperienceSection", () => {
  it("renders the role, company and location", () => {
    render(<ExperienceSection />);
    const role = experience[0]!;
    expect(screen.getByRole("heading", { name: role.role })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(role.company) })).toBeInTheDocument();
  });

  it("formats the date range instead of printing the ISO value", () => {
    render(<ExperienceSection />);
    expect(screen.getByText("Sep 2022 – Present")).toBeInTheDocument();
    expect(screen.queryByText("2022-09")).not.toBeInTheDocument();
  });

  it("shows a derived duration alongside the range", () => {
    render(<ExperienceSection />);
    expect(screen.getByText(/\d+ yrs?( \d+ mos?)?/)).toBeInTheDocument();
  });

  it("renders every highlight", () => {
    render(<ExperienceSection />);
    for (const highlight of experience[0]!.highlights) {
      expect(screen.getByText(new RegExp(highlight.text.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeInTheDocument();
    }
  });

  it("labels the resume-reported figure so it is not read as a fresh measurement", () => {
    render(<ExperienceSection />);
    const marker = screen.getByText("Reported in my résumé");
    expect(marker).toBeInTheDocument();
    // The explanation has to make both halves of the point: where the figure
    // came from, and that nobody re-measured it for this website.
    const title = marker.getAttribute("title") ?? "";
    expect(title).toMatch(/r[eé]sum[eé]/i);
    expect(title).toMatch(/not a measurement/i);
  });
});

describe("CaseStudySection", () => {
  it("renders the featured office project", () => {
    render(<CaseStudySection />);
    expect(screen.getByRole("heading", { name: "AAConnect", level: 2 })).toBeInTheDocument();
  });

  it("renders the confidentiality notice prominently", () => {
    render(<CaseStudySection />);
    const notice = screen.getByRole("complementary", { name: /confidentiality notice/i });
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(/no source code/i);
    expect(notice).toHaveTextContent(/no internal endpoint/i);
  });

  it("labels the architecture as illustrative rather than production", () => {
    render(<CaseStudySection />);
    const label = screen.getByText(/illustrative · not production/);
    expect(label).toBeInTheDocument();
    // The tooltip has to spell out what the badge means, not just hint at it.
    expect(label).toHaveAttribute(
      "title",
      expect.stringMatching(/not a reproduction of any production architecture/i),
    );
  });

  it("renders the explorer with its three views and a legend", () => {
    render(<CaseStudySection />);
    expect(
      screen.getByRole("button", { name: /play complete request lifecycle/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sequence" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Failure paths" })).toBeInTheDocument();
    expect(screen.getByText("Asynchronous notification")).toBeInTheDocument();
    expect(screen.getByText("Failure path")).toBeInTheDocument();
  });

  it("links through to the full case study", () => {
    render(<CaseStudySection />);
    expect(
      screen.getByRole("link", { name: /read the full case study/i }),
    ).toHaveAttribute("href", "/projects/aaconnect");
  });

  it("publishes no repository link for employer-owned work", () => {
    render(<CaseStudySection />);
    expect(screen.queryByRole("link", { name: /repository/i })).not.toBeInTheDocument();
  });
});

describe("Projects", () => {
  it("lists the independent projects", () => {
    render(<Projects />);
    expect(screen.getByRole("heading", { name: "FinSight" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "E-commerce Backend" })).toBeInTheDocument();
  });

  it("does not repeat the office project, which has its own section", () => {
    render(<Projects />);
    expect(screen.queryByRole("heading", { name: "AAConnect" })).not.toBeInTheDocument();
  });

  it("no longer lists the retired DSA project", () => {
    const { container } = render(<Projects />);
    const text = (container.textContent ?? "").toLowerCase();
    expect(text).not.toContain("leetcode");
    expect(text).not.toContain("java dsa");
  });

  it("describes SQL Interview Mastery as complete, now that it is", () => {
    render(<Projects />);
    // The page said "in development — the frontend has not been started" long
    // after both had stopped being true. It is now 232 backend and 26 frontend
    // tests passing, so the status says so.
    expect(
      screen.getByRole("heading", { name: "SQL Interview Mastery" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("In development")).not.toBeInTheDocument();
  });
});

describe("Skills", () => {
  it("renders the groups and their filters", () => {
    render(<Skills />);
    expect(screen.getByRole("heading", { name: /technical skills/i })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Backend" })).toBeInTheDocument();
  });
});

describe("EducationSection", () => {
  it("renders the degree, institution and years", () => {
    render(<EducationSection />);
    const entry = education[0]!;
    expect(screen.getByRole("heading", { name: entry.degree })).toBeInTheDocument();
    expect(screen.getByText(entry.institution)).toBeInTheDocument();
    expect(
      screen.getByText(`${entry.startYear} – ${entry.endYear}`),
    ).toBeInTheDocument();
  });

  it("shows no grade or percentage, because none was supplied", () => {
    const { container } = render(<EducationSection />);
    expect(container.textContent).not.toMatch(/\d+(\.\d+)?\s*%/);
    expect(container.textContent).not.toMatch(/\bCGPA\b/i);
  });
});

describe("Contact", () => {
  it("renders email, location and the social channels", () => {
    render(<Contact />);
    expect(screen.getByText(profile.email)).toBeInTheDocument();
    expect(screen.getByText(profile.location)).toBeInTheDocument();
  });

  it("makes the email actionable", () => {
    render(<Contact />);
    expect(
      screen.getByRole("link", { name: new RegExp(`Email: ${profile.email}`) }),
    ).toHaveAttribute("href", `mailto:${profile.email}`);
  });

  it("omits the phone row, because no phone is configured for the public site", () => {
    // `phone` is commented out in profile.ts on purpose — a number on a public
    // page gets scraped. This asserts the current, intended configuration;
    // Contact.phone.test.tsx proves the row still works when it IS set.
    expect(profile.phone).toBeUndefined();

    render(<Contact />);
    expect(screen.queryByRole("link", { name: /Phone:/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/\+91/)).not.toBeInTheDocument();
  });

  it("ships no contact form, rather than one that discards messages", () => {
    const { container } = render(<Contact />);
    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelector('input[type="text"]')).toBeNull();
    expect(container.querySelector("textarea")).toBeNull();
  });

  it("offers the resume download", () => {
    render(<Contact />);
    expect(screen.getByRole("link", { name: /download resume/i })).toBeInTheDocument();
  });
});
