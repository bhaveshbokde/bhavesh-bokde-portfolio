"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Entrance choreography for the hero.
 *
 * One parent, one `staggerChildren`, so the sequence is declared in a single
 * place rather than as a column of hand-tuned `delay` values that drift apart
 * the moment a line is inserted. Adding an element puts it in the sequence
 * automatically, in document order, which is also the reading order.
 *
 * The timing is deliberately short. A hero that takes two seconds to assemble
 * is a hero that has made the visitor wait before they can click anything, and
 * nothing here is worth waiting for.
 *
 * Under reduced motion both components render a plain element with no initial
 * state — content that only becomes visible once an animation runs is a bug,
 * not an effect.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export function Choreo({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.07, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function ChoreoItem({
  children,
  className,
  as = "div",
  distance = 14,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "p" | "h1" | "ul" | "span";
  distance?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const Tag = as;

  if (reduced) return <Tag className={className}>{children}</Tag>;

  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      variants={{
        hidden: { opacity: 0, y: distance },
        visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
      }}
    >
      {children}
    </MotionTag>
  );
}
