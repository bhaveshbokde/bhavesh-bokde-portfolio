"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * The hero's technology row.
 *
 * Each label fades up with a small stagger, then a hairline underneath sweeps
 * in once. The restraint is deliberate: these animate on arrival and then stop
 * for good. A row of chips that keeps pulsing is movement competing with the
 * headline next to it.
 *
 * Under reduced motion the labels render plainly, with no initial opacity —
 * content that only becomes visible once an animation runs is a bug.
 */
export function TechMarquee({ items }: { items: string[] }) {
  const reduced = usePrefersReducedMotion();
  if (items.length === 0) return null;

  return (
    <ul className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-2">
      {items.map((item, index) => {
        const content = (
          <span className="group relative inline-flex items-center gap-2 rounded-lg border border-ink-600/70 bg-ink-850/50 px-3 py-1.5 font-mono text-xs text-mist-300 backdrop-blur-sm transition-colors duration-300 hover:border-azure-500/50 hover:text-white">
            <span
              aria-hidden="true"
              className="h-1 w-1 rounded-full bg-azure-400/70 transition-colors duration-300 group-hover:bg-azure-400"
            />
            {item}
            {/* Underline sweep, hover only — so touch users simply never see
                it rather than getting a stuck hover state. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-2 -bottom-px h-px origin-left scale-x-0 bg-gradient-to-r from-azure-400/80 to-iris-400/80 transition-transform duration-400 ease-out group-hover:scale-x-100"
            />
          </span>
        );

        if (reduced) {
          return <li key={item}>{content}</li>;
        }

        return (
          <motion.li
            key={item}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              delay: 0.5 + index * 0.07,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {content}
          </motion.li>
        );
      })}
    </ul>
  );
}
