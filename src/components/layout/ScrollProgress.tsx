"use client";

import { useEffect, useRef } from "react";

/**
 * A hairline progress bar across the top of the viewport.
 *
 * Written against the DOM rather than React state on purpose. Scroll fires
 * continuously, and routing every event through `setState` would re-render the
 * component dozens of times a second to change one CSS transform. This writes
 * the transform directly inside a rAF, so the work per scroll event is a
 * single style mutation on the compositor.
 *
 * `scaleX` rather than `width`, for the same reason: width triggers layout,
 * transforms do not.
 *
 * It is purely decorative — `aria-hidden`, and removed entirely under reduced
 * motion, where a bar that tracks the scroll position is exactly the kind of
 * constant movement the preference is asking to be rid of.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let raf = 0;

    const update = () => {
      raf = 0;
      const scrollable =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-motion="decorative"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
    >
      <div
        ref={barRef}
        className="h-full origin-left scale-x-0 bg-gradient-to-r from-azure-500 via-iris-400 to-aqua-400"
      />
    </div>
  );
}
