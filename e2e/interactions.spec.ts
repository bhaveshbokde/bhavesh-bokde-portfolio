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
  test("renders on the case study page with its legend", async ({ page }) => {
    await page.goto("/projects/aaconnect");

    await expect(
      page.getByRole("group", { name: /interactive architecture diagram/i }).first(),
    ).toBeVisible();
    await expect(page.getByText("Retry & failure path").first()).toBeVisible();
  });

  test("selecting a component swaps the explanation", async ({ page }) => {
    await page.goto("/projects/aaconnect");

    const adapters = page.getByRole("button", { name: /Provider adapters/ }).first();
    await adapters.click();

    await expect(
      page.getByRole("heading", { name: /Provider adapters/ }).first(),
    ).toBeVisible();
    await expect(adapters).toHaveAttribute("aria-pressed", "true");
  });

  test("the lifecycle walkthrough advances through steps", async ({ page }) => {
    await page.goto("/projects/aaconnect");

    await page.getByRole("button", { name: /play request lifecycle/i }).first().click();
    await expect(page.getByText(/Step 1 of/).first()).toBeVisible();

    // Stopping is available while it runs.
    await expect(
      page.getByRole("button", { name: /stop walkthrough/i }).first(),
    ).toBeVisible();
  });

  test("is operable from the keyboard", async ({ page }) => {
    await page.goto("/projects/aaconnect");

    const gateway = page.getByRole("button", { name: /API gateway/ }).first();
    await gateway.focus();
    await page.keyboard.press("ArrowRight");

    // Focus moved to another component and selected it.
    const focusedPressed = await page.evaluate(
      () => document.activeElement?.getAttribute("aria-pressed"),
    );
    expect(focusedPressed).toBe("true");
  });

  test("publishes no provider names, endpoints or hostnames", async ({ page }) => {
    await page.goto("/projects/aaconnect");
    const text = (await page.locator("body").innerText()).toLowerCase();

    for (const forbidden of ["anumati", "finvu", "phonepe", "nsdl", "onemoney"]) {
      expect(text, `must not name "${forbidden}"`).not.toContain(forbidden);
    }
    expect(text).not.toMatch(/\/api\/v\d/);
  });

  test("renders without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/projects/aaconnect", { waitUntil: "load" });
    await page.getByRole("button", { name: /Consent service/ }).first().click();
    await page.waitForTimeout(600);

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

    await page.getByRole("button", { name: /FI request service/ }).first().click();
    await expect(
      page.getByRole("heading", { name: /FI request service/ }).first(),
    ).toBeVisible();
  });

  test("the command palette still opens", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press(`${MOD}+KeyK`);
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
