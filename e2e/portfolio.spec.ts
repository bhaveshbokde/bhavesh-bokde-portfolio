import { expect, test, type Page } from "@playwright/test";

/**
 * End-to-end tests against the production build.
 *
 * These cover the things a unit test cannot: that the resume actually
 * downloads a real PDF, that in-page anchors land on the right section, that
 * the static project pages exist, and that nothing logs an error to the
 * console on the way.
 */

/** Collects console errors and page errors for the lifetime of a page. */
function captureProblems(page: Page): string[] {
  const problems: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "unknown";
    // Chrome aborts in-flight requests on navigation; that is not a defect.
    if (failure.includes("ERR_ABORTED")) return;
    problems.push(`requestfailed: ${request.url()} — ${failure}`);
  });

  return problems;
}

test.describe("home page", () => {
  test("loads with the right title, heading and metadata", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Bhavesh Bokde/);

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText("Bhavesh Bokde");
    await expect(heading).toContainText("Java Backend Engineer");

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /Account Aggregator/,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  });

  test("renders every configured section", async ({ page }) => {
    await page.goto("/");

    for (const id of [
      "hero",
      "about",
      "experience",
      "case-study",
      "projects",
      "skills",
      "education",
      "contact",
    ]) {
      await expect(page.locator(`#${id}`), `section #${id}`).toHaveCount(1);
    }
  });

  test("logs nothing to the console", async ({ page }) => {
    const problems = captureProblems(page);

    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);

    expect(problems).toEqual([]);
  });

  test("has exactly one h1 and a sensible heading order", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    expect(await page.getByRole("heading", { level: 2 }).count()).toBeGreaterThan(3);
  });

  test("loads every image it references", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    const broken = await page.evaluate(() =>
      Array.from(document.images)
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
    );
    expect(broken).toEqual([]);
  });

  test("gives every image alt text", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const missing = await page.evaluate(() =>
      Array.from(document.images)
        .filter((image) => !image.hasAttribute("alt"))
        .map((image) => image.currentSrc || image.src),
    );
    expect(missing).toEqual([]);
  });
});

test.describe("navigation", () => {
  test("in-page links scroll to their section", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "desktop nav only");

    await page.goto("/");
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Projects" }).click();

    await expect(page).toHaveURL(/#projects$/);
    await expect(page.locator("#projects")).toBeInViewport({ ratio: 0.1 });
  });

  test("every hero call to action resolves", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: /view projects/i }).first()).toHaveAttribute(
      "href",
      "#projects",
    );
    await expect(page.getByRole("link", { name: /contact me/i }).first()).toHaveAttribute(
      "href",
      "#contact",
    );
  });

  test("the skip link is the first thing a keyboard reaches", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const focused = page.locator(":focus");
    await expect(focused).toHaveText(/skip to main content/i);
    await expect(focused).toBeVisible();
  });

  test("no internal link is broken", async ({ page, request }) => {
    await page.goto("/");

    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
        .map((anchor) => anchor.getAttribute("href") ?? "")
        .filter((href) => href.startsWith("/")),
    );

    for (const href of [...new Set(hrefs)]) {
      const response = await request.get(href);
      expect(response.status(), `${href} should resolve`).toBeLessThan(400);
    }
  });

  test("in-page anchors all point at elements that exist", async ({ page }) => {
    await page.goto("/");

    const anchors = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
        .map((anchor) => anchor.getAttribute("href") ?? "")
        .filter((href) => href.length > 1),
    );

    for (const href of [...new Set(anchors)]) {
      await expect(page.locator(href), `${href} should exist`).toHaveCount(1);
    }
  });
});

test.describe("mobile menu", () => {
  test("opens, navigates and closes", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "mobile viewport only");

    await page.goto("/");

    const toggle = page.getByRole("button", { name: /open menu/i });
    await expect(toggle).toBeVisible();
    await toggle.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("link", { name: "Skills" }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/#skills$/);
  });

  test("closes on Escape", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "mobile viewport only");

    await page.goto("/");
    await page.getByRole("button", { name: /open menu/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("the page does not scroll sideways", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows).toBe(false);
  });
});

test.describe("resume", () => {
  test("is served as a real PDF", async ({ request }) => {
    const response = await request.get(
      "/resume/Bhavesh-Bokde-Java-Backend-Engineer.pdf",
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("pdf");

    const body = await response.body();
    expect(body.byteLength).toBeGreaterThan(10_000);
    // Every PDF begins with the magic bytes "%PDF".
    expect(body.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  test("the download button actually downloads it", async ({ page }) => {
    await page.goto("/");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: /download resume/i }).first().click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(
      "Bhavesh-Bokde-Java-Backend-Engineer.pdf",
    );
  });
});

test.describe("external links", () => {
  test("GitHub and LinkedIn point at the right profiles and open safely", async ({
    page,
  }) => {
    await page.goto("/");

    const external = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')).map(
        (anchor) => ({
          href: anchor.href,
          target: anchor.getAttribute("target"),
          rel: anchor.getAttribute("rel") ?? "",
        }),
      ),
    );

    expect(external.some((link) => link.href === "https://github.com/bhaveshbokde")).toBe(
      true,
    );
    expect(
      external.some((link) => link.href === "https://www.linkedin.com/in/bhavesh-bokde"),
    ).toBe(true);

    for (const link of external) {
      expect(link.target, `${link.href} should open in a new tab`).toBe("_blank");
      expect(link.rel, `${link.href} needs noopener`).toContain("noopener");
      expect(link.rel, `${link.href} needs noreferrer`).toContain("noreferrer");
    }
  });
});

test.describe("project pages", () => {
  const slugs = [
    "aaconnect",
    "finsight",
    "ecommerce-backend",
    "notification-service",
    "java-dsa-leetcode",
    "sql-interview-mastery",
  ];

  for (const slug of slugs) {
    test(`/projects/${slug} renders`, async ({ page }) => {
      const problems = captureProblems(page);
      const response = await page.goto(`/projects/${slug}`);

      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
      expect(problems).toEqual([]);
    });
  }

  test("the office project shows its confidentiality notice and no repository link", async ({
    page,
  }) => {
    await page.goto("/projects/aaconnect");

    // The case-study hero carries the scope notice up front, rather than a
    // separate block further down the page.
    const notice = page.getByRole("complementary", { name: /scope and confidentiality/i });
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(/no source code/i);
    await expect(notice).toContainText(/does not reproduce any production architecture/i);

    await expect(page.getByRole("link", { name: /view repository/i })).toHaveCount(0);
  });

  test("an independent project links to its repository", async ({ page }) => {
    await page.goto("/projects/finsight");
    await expect(page.getByRole("link", { name: /view repository/i })).toHaveAttribute(
      "href",
      "https://github.com/bhaveshbokde/finsight-financial-backend",
    );
  });

  test("the unfinished project is not described as complete", async ({ page }) => {
    await page.goto("/projects/sql-interview-mastery");
    await expect(page.getByText("In development").first()).toBeVisible();
    await expect(page.getByText("Complete", { exact: true })).toHaveCount(0);
  });
});

test.describe("404", () => {
  test("returns a styled, non-indexed not-found page", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /doesn't exist/i,
    );
    await expect(page.getByRole("link", { name: /back to home/i })).toBeVisible();
  });

  test("an unknown project slug 404s too", async ({ page }) => {
    const response = await page.goto("/projects/not-a-real-project");
    expect(response?.status()).toBe(404);
  });
});

test.describe("SEO endpoints", () => {
  test("robots.txt points at the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("Sitemap:");
  });

  test("sitemap.xml lists the home page and every project", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);

    const xml = await response.text();
    expect(xml).toContain("<urlset");
    expect(xml).toContain("/projects/aaconnect");
    expect(xml).toContain("/projects/finsight");
  });

  test("the favicon and OG image are served", async ({ request }) => {
    expect((await request.get("/icon.svg")).status()).toBe(200);

    const og = await request.get("/og.png");
    expect(og.status()).toBe(200);
    expect(og.headers()["content-type"]).toContain("image/png");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("renders the full page with decorative motion removed", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // The content must still be there — a reveal animation that never runs
    // must not leave its content invisible.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("#projects")).toHaveCount(1);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);

    await expect(page.getByRole("heading", { name: "FinSight" })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("decorative layers are hidden rather than frozen", async ({ page }) => {
    await page.goto("/");

    const anyVisible = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-motion="decorative"]')).some(
        (element) => getComputedStyle(element).display !== "none",
      ),
    );
    expect(anyVisible).toBe(false);
  });

  test("scrolling is instant, not smooth", async ({ page }) => {
    await page.goto("/");
    const behaviour = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    );
    expect(behaviour).toBe("auto");
  });
});

test.describe("responsive layout", () => {
  for (const viewport of [
    { name: "mobile", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "laptop", width: 1280, height: 800 },
    { name: "desktop", width: 1920, height: 1080 },
  ]) {
    test(`${viewport.name} (${viewport.width}px) has no horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/", { waitUntil: "networkidle" });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(600);

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      expect(scrollWidth, `${viewport.name} overflows horizontally`).toBeLessThanOrEqual(
        clientWidth + 1,
      );
    });
  }
});
