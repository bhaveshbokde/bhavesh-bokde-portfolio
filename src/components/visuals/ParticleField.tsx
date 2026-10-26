"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * A slow particle network behind the hero: drifting nodes, with a line drawn
 * between any two that come close enough.
 *
 * Why canvas rather than Three.js or a particle library: this is ~60 points
 * and some line segments. A WebGL scene would ship hundreds of kilobytes, hold
 * a GPU context and drain a phone battery to draw something 2D. The whole file
 * is a few hundred lines of arithmetic and the bundle cost is nil.
 *
 * The things that keep it from being a performance problem:
 *
 * - **It stops when it cannot be seen.** An IntersectionObserver cancels the
 *   RAF loop once the hero scrolls away, and the Page Visibility API pauses it
 *   in a background tab. An animation nobody is looking at is pure heat.
 * - **Point count scales to the viewport**, so a phone draws far fewer than a
 *   desktop rather than the same count squeezed smaller.
 * - **Connections are found on a spatial grid**, not by comparing every pair.
 *   All-pairs is O(n²) — fine at 60 points, but it degrades badly the moment
 *   someone raises the density, and this way it does not.
 * - **It is capped at ~30fps.** At this speed nobody can tell, and it halves
 *   the work.
 * - **Reduced motion renders one static frame** and never starts the loop.
 *
 * The cursor pulls nearby points gently. That is the only interactivity, and
 * it is skipped entirely on touch devices where there is no cursor to follow.
 */

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

const CONNECT_DISTANCE = 128;
const CURSOR_RADIUS = 170;
const TARGET_FPS = 30;

export function ParticleField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Cap DPR at 2: beyond that the cost doubles again for pixels nobody can
    // distinguish on a background effect.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let points: Point[] = [];
    let raf = 0;
    let lastFrame = 0;
    let visible = true;
    let inView = true;

    const pointer = { x: -9999, y: -9999, active: false };
    const canHover = window.matchMedia?.("(hover: hover)").matches ?? false;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density by area, clamped so a 4K monitor does not get 400 points and a
      // phone still gets enough to read as a network.
      const count = Math.round(
        Math.min(78, Math.max(22, (width * height) / 16000)),
      );

      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.17,
        vy: (Math.random() - 0.5) * 0.17,
        r: Math.random() * 1.3 + 0.7,
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      // --- connections, via a spatial hash so this stays linear -----------
      const cell = CONNECT_DISTANCE;
      const grid = new Map<string, Point[]>();
      for (const p of points) {
        const key = `${Math.floor(p.x / cell)},${Math.floor(p.y / cell)}`;
        const bucket = grid.get(key);
        if (bucket) bucket.push(p);
        else grid.set(key, [p]);
      }

      ctx!.lineWidth = 1;
      for (const p of points) {
        const cx = Math.floor(p.x / cell);
        const cy = Math.floor(p.y / cell);

        // Only the 4 forward neighbours, so each pair is considered once.
        for (const [dx, dy] of [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ] as const) {
          for (const q of grid.get(`${cx + dx},${cy + dy}`) ?? []) {
            if (q === p) continue;
            const ddx = p.x - q.x;
            const ddy = p.y - q.y;
            const dist = Math.hypot(ddx, ddy);
            if (dist > CONNECT_DISTANCE) continue;

            const strength = 1 - dist / CONNECT_DISTANCE;
            ctx!.strokeStyle = `rgba(91,156,255,${strength * 0.16})`;
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(q.x, q.y);
            ctx!.stroke();
          }
        }
      }

      // --- points ----------------------------------------------------------
      for (const p of points) {
        const nearCursor =
          pointer.active && Math.hypot(p.x - pointer.x, p.y - pointer.y) < CURSOR_RADIUS;
        ctx!.fillStyle = nearCursor
          ? "rgba(169,139,255,0.85)"
          : "rgba(130,141,166,0.42)";
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function step(now: number) {
      raf = requestAnimationFrame(step);
      if (!visible || !inView) return;
      if (now - lastFrame < 1000 / TARGET_FPS) return;
      lastFrame = now;

      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap rather than bounce — bouncing makes the edges visible as walls.
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        if (pointer.active) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < CURSOR_RADIUS && dist > 1) {
            // A very small pull. Anything stronger reads as the page grabbing
            // at the cursor, which is irritating rather than alive.
            p.x += (dx / dist) * 0.22;
            p.y += (dy / dist) * 0.22;
          }
        }
      }

      draw();
    }

    resize();

    if (reduced) {
      // One static frame: the network is still there to look at, it just
      // never moves and no loop is ever scheduled.
      draw();
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!canHover) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };
    const onVisibility = () => {
      visible = document.visibilityState === "visible";
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inView = entry?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="particle-field"
      className={className}
    />
  );
}
