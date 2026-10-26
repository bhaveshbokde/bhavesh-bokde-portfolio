import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/**
 * `next/navigation`'s hooks throw "invariant expected app router to be mounted"
 * outside a Next request, so anything using `useRouter` cannot render in jsdom
 * without this. Mocking it here rather than per-file means a component that
 * starts navigating does not suddenly break unrelated suites.
 *
 * `routerMock` is exported so a test can assert where a component navigated.
 */
export const routerMock = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

afterEach(() => {
  cleanup();
  Object.values(routerMock).forEach((fn) => fn.mockClear());
});

// jsdom implements neither matchMedia nor IntersectionObserver, and both are
// used by the reveal-on-scroll and reduced-motion code paths. Stubbing them
// here keeps every component test honest: components still run their real
// logic, they just get a predictable browser.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

if (!("IntersectionObserver" in window)) {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: MockIntersectionObserver,
  });
}

if (!window.scrollTo) {
  Object.defineProperty(window, "scrollTo", { writable: true, value: vi.fn() });
}

// jsdom implements no scrolling at all, so Element.prototype.scrollIntoView is
// simply absent. Components that keep an active option in view call it on
// every selection change, and without this every one of those tests dies on
// "scrollIntoView is not a function" — a gap in the test environment rather
// than a defect in the component.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
