"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export interface PointerTiltOptions {
  /** Maximum rotation in degrees on each axis. Small is the point. */
  maxTilt?: number;
  /** How far the content lifts towards the viewer, in pixels. */
  lift?: number;
  /** Perspective depth. Larger is a flatter, more expensive-looking tilt. */
  perspective?: number;
}

/**
 * Pointer-tracked tilt for a card or panel.
 *
 * Written against the DOM rather than React state. Pointer movement fires
 * continuously; routing each event through `setState` would re-render the
 * component dozens of times a second to change one transform. This writes the
 * transform directly inside a rAF, so the cost per event is a single
 * composited style mutation and React never re-renders at all.
 *
 * Three things keep it from being obnoxious:
 *
 * - **It only runs for a real pointer.** `(hover: hover) and (pointer: fine)`
 *   gates it, so a touchscreen never gets a tilt that it cannot control and
 *   cannot undo — on a phone the card is simply a card.
 * - **Reduced motion disables it entirely.** No listener is attached, so there
 *   is nothing to cancel mid-gesture.
 * - **Transform only.** No width, height, top or left is touched, so the
 *   browser never relayouts; this stays on the compositor.
 *
 * The CSS custom properties it writes (`--tilt-x`, `--tilt-y`, `--tilt-active`)
 * let the consuming component decide how to respond — a glare highlight, a
 * shadow, a parallax child — without this hook knowing anything about it.
 */
export function usePointerTilt<T extends HTMLElement>({
  maxTilt = 5,
  lift = 6,
  perspective = 1100,
}: PointerTiltOptions = {}) {
  const ref = useRef<T>(null);
  const frame = useRef(0);
  const reduced = usePrefersReducedMotion();

  const reset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
    el.style.transform = "";
    el.style.setProperty("--tilt-active", "0");
    el.style.setProperty("--tilt-x", "50%");
    el.style.setProperty("--tilt-y", "50%");
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    // A coarse pointer cannot hover, so a tilt would either never trigger or
    // stick after a tap. Neither is worth shipping.
    const fine = window.matchMedia?.("(hover: hover) and (pointer: fine)");
    if (fine && !fine.matches) return;

    let latest: { x: number; y: number } | null = null;

    const apply = () => {
      frame.current = 0;
      const point = latest;
      if (!point) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Normalised to -0.5 … 0.5 from the centre of the element.
      const px = (point.x - rect.left) / rect.width - 0.5;
      const py = (point.y - rect.top) / rect.height - 0.5;

      // Y movement tilts around X, and vice versa — that inversion is what
      // makes it read as a physical object rather than a sliding plane.
      el.style.transform =
        `perspective(${perspective}px) ` +
        `rotateX(${(-py * maxTilt).toFixed(3)}deg) ` +
        `rotateY(${(px * maxTilt).toFixed(3)}deg) ` +
        `translate3d(0, ${-lift}px, 0)`;

      el.style.setProperty("--tilt-x", `${((px + 0.5) * 100).toFixed(2)}%`);
      el.style.setProperty("--tilt-y", `${((py + 0.5) * 100).toFixed(2)}%`);
      el.style.setProperty("--tilt-active", "1");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      latest = { x: event.clientX, y: event.clientY };
      if (!frame.current) frame.current = requestAnimationFrame(apply);
    };

    el.addEventListener("pointermove", onPointerMove, { passive: true });
    el.addEventListener("pointerleave", reset);
    // A card can also be reached by keyboard, where there is no pointer to
    // track — make sure a stale tilt from an earlier hover does not persist.
    el.addEventListener("focusin", reset);

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerleave", reset);
      el.removeEventListener("focusin", reset);
      el.style.transform = "";
    };
  }, [reduced, maxTilt, lift, perspective, reset]);

  return ref;
}
