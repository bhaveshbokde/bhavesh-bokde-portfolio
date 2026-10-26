import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * The other half of the optional-phone contract.
 *
 * `Sections.test.tsx` asserts that the phone row is absent, which is the
 * current public configuration. This file mocks a phone back in and proves the
 * row still renders correctly — so the feature is verified in both states and
 * uncommenting the line in `profile.ts` cannot quietly be broken by a future
 * change to the contact section.
 *
 * The mock lives in its own file because `vi.mock` is hoisted to the top of the
 * module: a mocked and an unmocked import of the same module cannot coexist in
 * one test file.
 */
vi.mock("@/data/profile", async () => {
  const actual = await vi.importActual<typeof import("@/data/profile")>(
    "@/data/profile",
  );
  return {
    profile: { ...actual.profile, phone: "+91 9000000000" },
  };
});

const { Contact } = await import("./Contact");

describe("Contact when a phone number IS configured", () => {
  it("renders the phone row", () => {
    render(<Contact />);
    expect(screen.getByText("+91 9000000000")).toBeInTheDocument();
  });

  it("makes it dialable, stripping spaces from the tel: href only", () => {
    render(<Contact />);
    const link = screen.getByRole("link", { name: /Phone:/ });
    expect(link).toHaveAttribute("href", "tel:+919000000000");
    // The displayed value keeps its spacing for readability.
    expect(link).toHaveTextContent("+91 9000000000");
  });

  it("does not leak the real number into this test's render", () => {
    render(<Contact />);
    expect(screen.queryByText("+91 8830076645")).not.toBeInTheDocument();
  });
});

// The guard that the *real* profile publishes no phone lives in
// Sections.test.tsx. It cannot live here: `vi.mock` is module-wide, so even an
// aliased import of @/data/profile in this file resolves to the mock.
