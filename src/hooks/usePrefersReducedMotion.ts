"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Reads the user's reduced-motion preference and keeps watching it.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`, because a media
 * query *is* an external store and this is the hook built for subscribing to
 * one. Reading it in an effect and calling `setState` would render once with
 * the wrong value and then immediately re-render — the cascading-render
 * pattern React now warns about — and would also tear under concurrent
 * rendering.
 *
 * `getServerSnapshot` returns `false`: the server has no window, and assuming
 * motion is allowed matches the CSS, where `prefers-reduced-motion: reduce` is
 * an override rather than the default. The client's first commit corrects it
 * before anything has had time to animate, and there is no hydration mismatch
 * because React calls the server snapshot during hydration by design.
 *
 * The subscription matters: the preference can change while the page is open,
 * and an animation that keeps running after someone has just asked it to stop
 * is precisely the failure this exists to prevent.
 */

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia(QUERY);

  // Safari below 14 only has the deprecated addListener/removeListener pair.
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }

  mediaQuery.addListener(onChange);
  return () => mediaQuery.removeListener(onChange);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
