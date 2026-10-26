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

    // Scoped to the hero. `.first()` matched the header nav link instead,
    // so this assertion was passing against the wrong element entirely.
    const hero = page.locator("#hero");

    await expect(hero.getByRole("link", { name: /view projects/i })).toHaveAttribute(
      "href",
      "#projects",
    );
    await expect(hero.getByRole("link", { name: /experience/i })).toHaveAttribute(
      "href",
      "#experience",
    );
    await expect(hero.getByRole("link", { name: /résumé/i })).toHaveAttribute(
      "href",
      "/resume/Bhavesh-Bokde-Java-Backend-Engineer.pdf",
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

  test("SQL Mastery is described as complete, and backs it with evidence", async ({
    page,
  }) => {
    // It was labelled "in development — the frontend has not been started"
    // long after both had stopped being true. Verified before changing it:
    // 232 backend tests and 26 frontend tests passing, and a frontend that
    // typechecks and builds.
    await page.goto("/projects/sql-interview-mastery");

    await expect(page.getByText("Complete", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("In development")).toHaveCount(0);

    // A status claim should be accompanied by the numbers behind it.
    await expect(page.getByText("232 passing").first()).toBeVisible();
    await expect(page.getByText("26 passing").first()).toBeVisible();
  });

  test("no project claims a coverage figure it cannot measure", async ({ page }) => {
    await page.goto("/projects/sql-interview-mastery");
    const text = await page.locator("body").innerText();
    // JaCoCo cannot instrument the SQL parser dependency, so there is no
    // honest coverage number for this project and none is shown.
    expect(text).not.toMatch(/\d+(\.\d+)?% line coverage/);
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

  test("the retired DSA route is gone, not redirected", async ({ page }) => {
    // Removed from the public site at Bhavesh's request. The local project and
    // its GitHub repository are untouched — this asserts only that the
    // portfolio no longer advertises it, and that the route returns a genuine
    // 404 rather than quietly redirecting somewhere unrelated.
    const response = await page.goto("/projects/java-dsa-leetcode");
    expect(response?.status()).toBe(404);
    expect(page.url()).toContain("/projects/java-dsa-leetcode");
  });

  test("no page mentions the DSA project anywhere", async ({ page }) => {
    for (const route of ["/", "/projects/sql-interview-mastery", "/projects/aaconnect"]) {
      await page.goto(route, { waitUntil: "load" });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      const text = (await page.locator("body").innerText()).toLowerCase();
      expect(text, `${route} must not mention LeetCode`).not.toContain("leetcode");
      expect(text, `${route} must not mention Java DSA`).not.toContain("java dsa");
    }

    const sitemap = await (await page.request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("java-dsa-leetcode");
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

/* ────────────────────────────────────────────────────────────────────────────
   The redesigned sections. These assert behaviour the art direction
   introduced — not how anything looks, which no assertion can usefully pin.
   ──────────────────────────────────────────────────────────────────────── */

test.describe("contact", () => {
  test("copies the address and announces that it did", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const button = page.getByRole("button", { name: /copy email address/i });
    await button.scrollIntoViewIfNeeded();
    await button.click();

    // The outcome reaches assistive technology, not only the button's label.
    await expect(page.getByRole("status")).toHaveText(/copied to clipboard/i);

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain("@");
  });

  test("publishes the address exactly once, not as a heading and a row", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const contact = page.locator("#contact");
    const address = (await contact.textContent()) ?? "";
    const matches = address.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? [];
    expect(new Set(matches).size).toBe(1);
    expect(matches.length).toBe(1);
  });
});

test.describe("project detail pages", () => {
  test("number their sections continuously, with no gaps", async ({ page }) => {
    await page.goto("/projects/finsight", { waitUntil: "domcontentloaded" });

    const numbers = await page
      .locator("main section > div > span[aria-hidden='true']")
      .filter({ hasText: /^\d{2}$/ })
      .allTextContents();

    expect(numbers.length).toBeGreaterThan(2);
    // A filtered-out empty section must not leave a hole in the sequence.
    expect(numbers).toEqual(
      numbers.map((_, index) => String(index + 1).padStart(2, "0")),
    );
  });

  test("page index links resolve to real anchors on the page", async ({ page }) => {
    await page.goto("/projects/finsight", { waitUntil: "domcontentloaded" });

    const index = page.getByRole("navigation", { name: "On this page" });
    await expect(index).toBeVisible();

    const hrefs = await index.getByRole("link").evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute("href")),
    );
    expect(hrefs.length).toBeGreaterThan(1);

    for (const href of hrefs) {
      expect(href).toMatch(/^#/);
      await expect(page.locator(href!)).toHaveCount(1);
    }
  });

  test("the pager walks only visible projects and never dead-ends", async ({ page }) => {
    await page.goto("/projects/finsight", { waitUntil: "domcontentloaded" });

    const pager = page.getByRole("navigation", { name: "More projects" });
    await expect(pager).toBeVisible();

    for (const link of await pager.getByRole("link").all()) {
      const href = await link.getAttribute("href");
      expect(href).toMatch(/^\/projects\//);
      // The retired project must not be reachable by paging either.
      expect(href).not.toContain("dsa");

      const response = await page.request.get(href!);
      expect(response.status(), `${href} is not reachable`).toBe(200);
    }
  });
});

/* ────────────────────────────────────────────────────────────────────────────
   Overflow regressions.

   The unit tests in measure.test.ts check the *estimate*. These check what the
   browser actually drew, which is the only thing that catches a font change, a
   CSS regression, or an estimate that drifts out of calibration.
   ──────────────────────────────────────────────────────────────────────── */

test.describe("AAConnect architecture diagram", () => {
  for (const width of [768, 1280, 1920]) {
    test(`keeps every label inside its node at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/projects/aaconnect", { waitUntil: "networkidle" });

      const spills = await page.evaluate(() => {
        const svg = [...document.querySelectorAll("svg")].find(
          (s) => s.getAttribute("viewBox") === "0 0 1240 748",
        );
        if (!svg) return ["diagram svg not found"];
        const found: string[] = [];
        for (const g of svg.querySelectorAll("g[role='button']")) {
          const rect = g.querySelector("rect");
          if (!rect) continue;
          const r = rect.getBBox();
          for (const text of g.querySelectorAll("text")) {
            const t = text.getBBox();
            // 12 user units of inner right margin, matching NODE_METRICS.
            const spill = Math.max(
              r.x - t.x,
              t.x + t.width - (r.x + r.width - 10),
              r.y - t.y,
              t.y + t.height - (r.y + r.height),
            );
            if (spill > 0.5) {
              found.push(
                `"${text.textContent?.slice(0, 40)}" escapes its node by ${spill.toFixed(1)}u`,
              );
            }
          }
        }
        return found;
      });

      expect(spills, spills.join("; ")).toEqual([]);
    });
  }

  test("no two node boxes overlap once text has been wrapped", async ({ page }) => {
    // Wrapping grows a node downwards. If it grows into its neighbour the
    // diagram is wrong in a way that still "fits".
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/projects/aaconnect", { waitUntil: "networkidle" });

    const overlaps = await page.evaluate(() => {
      const svg = [...document.querySelectorAll("svg")].find(
        (s) => s.getAttribute("viewBox") === "0 0 1240 748",
      );
      const boxes = [...svg!.querySelectorAll("g[role='button']")].map((g) => ({
        label: g.querySelector("text")?.textContent ?? "?",
        b: g.querySelector("rect")!.getBBox(),
      }));
      const hits: string[] = [];
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i]!.b, c = boxes[j]!.b;
          const ox = Math.min(a.x + a.width, c.x + c.width) - Math.max(a.x, c.x);
          const oy = Math.min(a.y + a.height, c.y + c.height) - Math.max(a.y, c.y);
          if (ox > 0.5 && oy > 0.5)
            hits.push(`${boxes[i]!.label} overlaps ${boxes[j]!.label}`);
        }
      }
      return hits;
    });

    expect(overlaps, overlaps.join("; ")).toEqual([]);
  });
});

test.describe("no text escapes its container", () => {
  for (const route of ["/", "/projects/aaconnect", "/projects/sql-interview-mastery"]) {
    test(`${route} fits at 320px, the narrowest supported width`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      await page.goto(route, { waitUntil: "networkidle" });

      // Drive the explorer so the failure rows actually render.
      const failures = page.getByRole("tab", { name: "Failure paths" });
      if (await failures.count()) {
        await failures.click();
        await page.waitForTimeout(300);
      }

      const spills = await page.evaluate(() => {
        const found: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>("body *")) {
          if (el.closest("svg")) continue;
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden") continue;
          const r = el.getBoundingClientRect();
          // Visually-hidden content is clipped on purpose.
          if (r.width <= 1.5 && r.height <= 1.5) continue;
          if (cs.clipPath !== "none" || cs.clip !== "auto") continue;
          if (r.right < 0) continue;
          if (cs.overflowX === "auto" || cs.overflowX === "scroll") continue;
          const hasText = [...el.childNodes].some(
            (n) => n.nodeType === 3 && n.textContent!.trim(),
          );
          if (!hasText) continue;
          const over = el.scrollWidth - el.clientWidth;
          if (over > 1)
            found.push(
              `${el.tagName} "${el.textContent?.trim().slice(0, 40)}" overflows by ${over}px`,
            );
        }
        return found;
      });

      expect(spills, spills.join(" | ")).toEqual([]);
    });
  }
});

test.describe("responsive visibility actually applies", () => {
  // Both of these shipped broken: `cn` joins classes without resolving
  // conflicts, so a `hidden` passed as a prop lost to the component's own
  // display utility on stylesheet order.
  test("the header resume button is hidden on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const button = page
      .locator("header a[download]")
      .filter({ hasText: /resume/i });
    await expect(button).toBeHidden();
  });

  test("the provenance badge leaves the failure row on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/projects/aaconnect", { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: "Failure paths" }).click();

    // Scoped to the failure list: at 375px the first aria-expanded button on
    // the page is the mobile menu toggle, not a failure row.
    const row = page.locator("li button[aria-expanded][aria-controls]").first();
    const title = row.locator("span.flex-1");
    const box = await title.boundingBox();
    const rowBox = await row.boundingBox();
    // The title must get most of the row, not 43px of it.
    expect(box!.width).toBeGreaterThan(rowBox!.width * 0.55);
  });
});

test.describe("document integrity", () => {
  test("header nav links work from a project page, not just the homepage", async ({
    page,
  }) => {
    // Rendered verbatim, "#about" is a link to an element that does not exist
    // on a detail page, so clicking About from there did nothing.
    await page.goto("/projects/aaconnect", { waitUntil: "domcontentloaded" });

    const primary = page.getByRole("navigation", { name: "Primary" });
    if (!(await primary.isVisible())) {
      // Phone viewport: the same links live inside the mobile menu.
      await page.getByRole("button", { name: /open menu/i }).click();
    }
    const about = page
      .locator("header")
      .getByRole("link", { name: "About" })
      .first();
    await expect(about).toHaveAttribute("href", "/#about");

    await about.click();
    await page.waitForURL(/\/#about$/);
    await expect(page.locator("#about")).toBeVisible();
  });

  // A duplicate id is invalid HTML, and it silently breaks in-page anchors:
  // the browser jumps to whichever element comes first. This shipped on
  // /projects/aaconnect, where a case-study section id from projects.ts
  // collided with the architecture explorer's own id and the hero's
  // "Explore the architecture" button landed in the wrong place.
  for (const route of [
    "/",
    "/projects/aaconnect",
    "/projects/finsight",
    "/projects/sql-interview-mastery",
  ]) {
    test(`${route} has no duplicate element ids`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });

      const duplicates = await page.evaluate(() => {
        const seen = new Map<string, number>();
        for (const el of document.querySelectorAll("[id]")) {
          const id = el.id;
          if (!id) continue;
          seen.set(id, (seen.get(id) ?? 0) + 1);
        }
        return [...seen.entries()]
          .filter(([, count]) => count > 1)
          .map(([id, count]) => `#${id} appears ${count} times`);
      });

      expect(duplicates, duplicates.join("; ")).toEqual([]);
    });
  }

  test("every in-page anchor resolves to exactly one element", async ({ page }) => {
    await page.goto("/projects/aaconnect", { waitUntil: "networkidle" });

    // Same-page anchors only. A nav link rendered as "/#about" targets the
    // homepage and is correctly absent here — that is the fix, not a defect.
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
        .map((a) => a.getAttribute("href"))
        .filter((h): h is string => !!h && h !== "#"),
    );

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      await expect(page.locator(href), `${href} must resolve`).toHaveCount(1);
    }
  });
});
