import { expect, test } from "@playwright/test";

/**
 * End-to-end coverage for the interactive upgrades: the command palette, the
 * explorable architecture diagram, the particle field and the scroll progress
 * bar.
 *
 * These exist alongside the unit tests because the things most likely to break
 * here are browser-level: a real keyboard shortcut reaching the document, a
 * canvas actually painting, reduced motion genuinely removing movement, and
 * none of it throwing in a production bundle.
 */

const isMac = process.platform === "darwin";
const MOD = isMac ? "Meta" : "Control";

test.describe("command palette", () => {
  test("opens on the keyboard shortcut and closes on Escape", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press(`${MOD}+KeyK`);
    const dialog = page.getByRole("dialog", { name: /command palette/i });
    await expect(dialog).toBeVisible();

    await expect(page.getByRole("combobox", { name: /search commands/i })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("filters and navigates to a project", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press(`${MOD}+KeyK`);

    await page.getByRole("combobox", { name: /search commands/i }).fill("finsight");
    await expect(page.getByRole("option")).toHaveCount(1);

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/projects\/finsight$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("FinSight");
  });

  test("jumps to an in-page section", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press(`${MOD}+KeyK`);

    await page.getByRole("combobox", { name: /search commands/i }).fill("skills");
    await page.keyboard.press("Enter");

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.locator("#skills")).toBeInViewport({ ratio: 0.05 });
  });

  test("arrow keys move the selection without moving focus out of the input", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press(`${MOD}+KeyK`);

    const input = page.getByRole("combobox", { name: /search commands/i });
    const before = await input.getAttribute("aria-activedescendant");

    await page.keyboard.press("ArrowDown");

    await expect(input).toBeFocused();
    expect(await input.getAttribute("aria-activedescendant")).not.toBe(before);
  });

  test("the visible trigger opens it too", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "trigger is desktop-only");

    await page.goto("/");
    await page.getByRole("button", { name: /open command palette/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("logs no console errors while being used", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/");
    await page.keyboard.press(`${MOD}+KeyK`);
    await page.getByRole("combobox", { name: /search commands/i }).fill("re");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    expect(errors).toEqual([]);
  });
});

test.describe("architecture explorer", () => {
  // The canvas renders as an SVG on desktop and as a grouped list on mobile,
  // so these tests target the controls and copy that exist in both modes.

  test("renders on the case study page with its legend", async ({ page }) => {
    await page.goto("/projects/aaconnect");

    await expect(page.getByRole("tab", { name: "Architecture" })).toBeVisible();
    await expect(page.getByText("Asynchronous notification").first()).toBeVisible();
    await expect(page.getByText("Failure path").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Selected Account Aggregator/ }).filter({ visible: true }).first(),
    ).toBeVisible();
  });

  test("selecting a component swaps the explanation", async ({ page }) => {
    await page.goto("/projects/aaconnect");

    await page.getByRole("button", { name: /AA adapter layer/ }).filter({ visible: true }).first().click();
    await expect(
      page.getByRole("heading", { name: /AA adapter layer/ }).first(),
    ).toBeVisible();
    await expect(page.getByText("Responsibility").first()).toBeVisible();
  });

  test("states that the aggregator is not AAConnect", async ({ page }) => {
    await page.goto("/projects/aaconnect");

    await page.getByRole("button", { name: /Selected Account Aggregator/ }).filter({ visible: true }).first().click();
    await expect(
      page.getByText(/not AAConnect, and AAConnect is not this/i).first(),
    ).toBeVisible();
  });

  test("the lifecycle walkthrough advances through all ten stages", async ({ page }) => {
    await page.goto("/projects/aaconnect");

    await page.getByRole("button", { name: /next stage/i }).click();
    await expect(page.getByText(/Stage 1 of 10/).first()).toBeVisible();

    await page.getByRole("button", { name: /next stage/i }).click();
    await expect(page.getByText(/Stage 2 of 10/).first()).toBeVisible();

    // Jump straight to the last stage without autoplay.
    await page.getByRole("button", { name: /^Stage 10:/ }).click();
    await expect(page.getByText(/Stage 10 of 10/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /next stage/i })).toBeDisabled();
  });

  test("play and pause both work", async ({ page }) => {
    await page.goto("/projects/aaconnect");

    await page.getByRole("button", { name: /play complete request lifecycle/i }).click();
    await expect(page.getByRole("button", { name: /^Pause$/ })).toBeVisible();

    await page.getByRole("button", { name: /^Pause$/ }).click();
    await expect(
      page.getByRole("button", { name: /play complete request lifecycle/i }),
    ).toBeVisible();
  });

  test("resets back to the whole architecture", async ({ page }) => {
    await page.goto("/projects/aaconnect");

    await page.getByRole("button", { name: /next stage/i }).click();
    await expect(page.getByText(/Stage 1 of 10/).first()).toBeVisible();

    await page.getByRole("button", { name: /show full architecture/i }).click();
    await expect(page.getByText(/Stage 1 of 10/)).toHaveCount(0);
  });

  test("the sequence view shows the protocol operations in order", async ({ page }) => {
    await page.goto("/projects/aaconnect");
    await page.getByRole("tab", { name: "Sequence" }).click();

    // Both renderings are in the DOM — the SVG lanes and the mobile list — and
    // CSS hides one of them. Filtering to visible keeps this honest on both
    // viewports instead of asserting against whichever happens to be first.
    for (const op of [
      /POST \/Consent\/Notification/,
      /POST \/FI\/fetch/,
      /POST \/FI\/request/,
    ]) {
      await expect(
        page.getByText(op).filter({ visible: true }).first(),
        String(op),
      ).toBeVisible();
    }
  });

  test("the failure view explains signal, consequence and handling", async ({ page }) => {
    await page.goto("/projects/aaconnect");

    await page.getByRole("tab", { name: "Failure paths" }).click();
    const toggle = page.getByRole("button", { name: /Decryption failure/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("Signal").first()).toBeVisible();
    await expect(page.getByText("Consequence").first()).toBeVisible();
    await expect(page.getByText("Handling").first()).toBeVisible();
  });

  test("the SVG diagram is operable from the keyboard", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "the SVG canvas is desktop-only; mobile gets the list, covered below",
    );
    await page.goto("/projects/aaconnect");

    await page
      .getByRole("button", { name: /Client FIU\. the consuming/ })
      .filter({ visible: true })
      .first()
      .focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: /Client FIU/ }).first()).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("heading", { name: /End user/ }).first()).toBeVisible();
  });

  test("the mobile component list is operable", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "mobile viewport only");
    await page.goto("/projects/aaconnect");

    // The grouped list replaces the diagram below the md breakpoint — a
    // 1240-unit canvas is not usable with a thumb.
    const control = page
      .getByRole("button", { name: /Selected Account Aggregator/ })
      .filter({ visible: true })
      .first();
    await expect(control).toBeVisible();

    await control.click();
    await expect(control).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("heading", { name: /Selected Account Aggregator/ }).first(),
    ).toBeVisible();
  });

  test("publishes no provider names, endpoints or hostnames", async ({ page }) => {
    await page.goto("/projects/aaconnect");

    for (const tab of ["Architecture", "Sequence", "Failure paths"]) {
      await page.getByRole("tab", { name: tab }).click();
      const text = (await page.locator("body").innerText()).toLowerCase();
      for (const forbidden of ["anumati", "finvu", "phonepe", "nsdl", "onemoney"]) {
        expect(text, `${tab} must not name "${forbidden}"`).not.toContain(forbidden);
      }
    }
  });

  test("renders without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/projects/aaconnect", { waitUntil: "load" });
    await page.getByRole("button", { name: /Consent orchestration/ }).filter({ visible: true }).first().click();
    await page.getByRole("tab", { name: "Sequence" }).click();
    await page.getByRole("tab", { name: "Failure paths" }).click();
    await page.waitForTimeout(700);

    expect(errors).toEqual([]);
  });
});

test.describe("hero visuals", () => {
  test("the particle canvas paints", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    const canvas = page.getByTestId("particle-field");
    await expect(canvas).toBeAttached();

    // A canvas with zero backing pixels never sized itself.
    const size = await canvas.evaluate((el) => ({
      w: (el as HTMLCanvasElement).width,
      h: (el as HTMLCanvasElement).height,
    }));
    expect(size.w).toBeGreaterThan(0);
    expect(size.h).toBeGreaterThan(0);
  });

  test("the technology labels are present and readable", async ({ page }) => {
    await page.goto("/");
    for (const tech of ["Java", "Spring Boot", "PostgreSQL", "Redis", "Apache Kafka"]) {
      await expect(page.getByText(tech, { exact: true }).first()).toBeVisible();
    }
  });

  test("the canvas is hidden from assistive technology", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("particle-field")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});

test.describe("scroll progress", () => {
  test("advances as the page scrolls", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    const readScale = () =>
      page.evaluate(() => {
        const bar = document.querySelector<HTMLElement>(
          '[data-motion="decorative"] .origin-left',
        );
        const transform = bar ? getComputedStyle(bar).transform : "none";
        if (transform === "none") return 0;
        const match = /matrix\(([^,]+)/.exec(transform);
        return match ? Number(match[1]) : 0;
      });

    const atTop = await readScale();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const atBottom = await readScale();

    expect(atBottom).toBeGreaterThan(atTop);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("everything still renders and the progress bar is removed", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // The scroll bar is decorative and should be gone entirely.
    const barVisible = await page.evaluate(() => {
      const bar = document.querySelector('[data-motion="decorative"] .origin-left');
      return bar ? getComputedStyle(bar.parentElement!).display !== "none" : false;
    });
    expect(barVisible).toBe(false);
  });

  test("the particle canvas still paints a static frame", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    const canvas = page.getByTestId("particle-field");
    await expect(canvas).toBeAttached();
    const width = await canvas.evaluate((el) => (el as HTMLCanvasElement).width);
    expect(width).toBeGreaterThan(0);
  });

  test("the architecture diagram remains fully usable", async ({ page }) => {
    await page.goto("/projects/aaconnect", { waitUntil: "load" });

    await page.getByRole("button", { name: /FI request & fetch/ }).filter({ visible: true }).first().click();
    await expect(
      page.getByRole("heading", { name: /FI request & fetch/ }).first(),
    ).toBeVisible();

    // Manual stage navigation must still work without animation.
    await page.getByRole("button", { name: /next stage/i }).click();
    await expect(page.getByText(/Stage 1 of 10/).first()).toBeVisible();
  });

  test("the command palette still opens", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press(`${MOD}+KeyK`);
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
