"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export interface RevealProps {
  children: ReactNode;
  /** Seconds. Use small, staggered values — 0.05 per sibling is plenty. */
  delay?: number;
  /** Travel distance in pixels. Kept short on purpose; long slides feel cheap. */
  distance?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
  as?: "div" | "li" | "section" | "article" | "span";
}

/**
 * Fades and lifts its children into view the first time they are scrolled to.
 *
 * Two things make this safe rather than annoying:
 *
 * 1. `once: true` — it reveals once and then leaves the element alone. Content
 *    that re-animates every time it scrolls past is tiring to read.
 * 2. Reduced motion short-circuits the whole thing: no wrapper animation, no
 *    initial opacity. The content is simply *there*, which is the correct
 *    behaviour — content hidden behind a cancelled animation is a bug, not an
 *    accessibility feature.
 */
export function Reveal({
  children,
  delay = 0,
  distance = 16,
  direction = "up",
  className,
  as = "div",
}: RevealProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const offset = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
  }[direction];

  const variants: Variants = {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}
