"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * The hero's technical visual: an abstract consent-and-data-exchange flow.
 *
 * A gateway core sits in the middle; requests arrive from the left, providers
 * answer from the right, and packets travel the connecting paths. It is the
 * actual shape of the work rather than decoration that happens to look
 * technical — which is the only reason it earns the space.
 *
 * Implementation notes, because "a 3D hero" is usually where a portfolio's
 * performance goes to die:
 *
 * - Pure inline SVG. No Three.js, no canvas, no model to download. The whole
 *   thing is a few kilobytes of markup and ships in the HTML.
 * - Motion is `stroke-dashoffset` and `opacity` on a handful of nodes. There
 *   is no per-frame JavaScript and nothing recalculates layout.
 * - With reduced motion, every animation is dropped and the diagram renders
 *   as a still — still legible, still the same picture.
 *
 * The labels are generic role names. Nothing here depicts a real internal
 * topology, and the numbers are synthetic.
 */

const NODES_LEFT = [
  { id: "client", label: "Client app", y: 96 },
  { id: "client2", label: "Lending flow", y: 186 },
] as const;

const NODES_RIGHT = [
  { id: "aa", label: "Aggregators", y: 78 },
  { id: "fip", label: "Providers", y: 158 },
  { id: "store", label: "Datastore", y: 238 },
] as const;

export function HeroVisual() {
  const reduced = usePrefersReducedMotion();

  // Note: the wrapper is deliberately *not* aria-hidden. The diagram carries
  // meaning — it is the shape of the work — so it is exposed as an image with
  // a description. Only the backlight below is hidden, being pure decoration.
  return (
    <div className="relative w-full">
      {/* Backlight behind the diagram, so the strokes read as emissive. */}
      <div
        data-motion="decorative"
        className="absolute inset-0 -z-10 opacity-60 blur-[70px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 55% 45%, var(--color-iris-600) 0%, transparent 70%)",
        }}
      />

      <svg
        viewBox="0 0 640 330"
        role="img"
        aria-label="Abstract diagram: client applications send consent-backed requests through a gateway to account aggregators, financial information providers and a datastore."
        className="h-auto w-full"
      >
        <defs>
          <linearGradient id="hv-edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-azure-500)" stopOpacity="0.15" />
            <stop offset="50%" stopColor="var(--color-azure-400)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--color-iris-400)" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="hv-edge-r" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-iris-500)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="var(--color-iris-400)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--color-aqua-400)" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="hv-core" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-azure-400)" />
            <stop offset="100%" stopColor="var(--color-iris-500)" />
          </linearGradient>
          <radialGradient id="hv-core-glow">
            <stop offset="0%" stopColor="var(--color-iris-400)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--color-iris-400)" stopOpacity="0" />
          </radialGradient>
          <filter id="hv-soft" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* ---- connecting edges ------------------------------------- */}
        {NODES_LEFT.map((node, index) => (
          <g key={node.id}>
            <path
              d={`M 134 ${node.y} C 198 ${node.y}, 216 165, 276 165`}
              fill="none"
              stroke="url(#hv-edge)"
              strokeWidth="1.5"
            />
            {!reduced && (
              <path
                data-motion="decorative"
                d={`M 134 ${node.y} C 198 ${node.y}, 216 165, 276 165`}
                fill="none"
                stroke="var(--color-azure-300)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="3 150"
                className="animate-dash"
                style={{ animationDelay: `${index * 1.3}s`, animationDuration: "3.4s" }}
              />
            )}
          </g>
        ))}

        {NODES_RIGHT.map((node, index) => (
          <g key={node.id}>
            <path
              d={`M 364 165 C 424 165, 440 ${node.y}, 506 ${node.y}`}
              fill="none"
              stroke="url(#hv-edge-r)"
              strokeWidth="1.5"
            />
            {!reduced && (
              <path
                data-motion="decorative"
                d={`M 364 165 C 424 165, 440 ${node.y}, 506 ${node.y}`}
                fill="none"
                stroke="var(--color-iris-300)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="3 150"
                className="animate-dash"
                style={{ animationDelay: `${0.6 + index * 1.1}s`, animationDuration: "3.8s" }}
              />
            )}
          </g>
        ))}

        {/* ---- left nodes -------------------------------------------- */}
        {NODES_LEFT.map((node) => (
          <g key={node.id}>
            <rect
              x="12"
              y={node.y - 20}
              width="122"
              height="40"
              rx="10"
              fill="var(--color-ink-800)"
              stroke="var(--color-ink-600)"
              strokeWidth="1"
            />
            <circle cx="32" cy={node.y} r="3.5" fill="var(--color-azure-400)" />
            <text
              x="46"
              y={node.y + 4}
              fill="var(--color-mist-300)"
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              {node.label}
            </text>
          </g>
        ))}

        {/* ---- right nodes ------------------------------------------- */}
        {NODES_RIGHT.map((node) => (
          <g key={node.id}>
            <rect
              x="506"
              y={node.y - 18}
              width="118"
              height="36"
              rx="10"
              fill="var(--color-ink-800)"
              stroke="var(--color-ink-600)"
              strokeWidth="1"
            />
            <circle cx="524" cy={node.y} r="3.5" fill="var(--color-iris-400)" />
            <text
              x="536"
              y={node.y + 4}
              fill="var(--color-mist-300)"
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              {node.label}
            </text>
          </g>
        ))}

        {/* ---- the core ---------------------------------------------- */}
        <circle cx="320" cy="165" r="96" fill="url(#hv-core-glow)" filter="url(#hv-soft)" />

        {/* Orbit rings. Rotating these two is the only continuous motion
            on the page, and they turn once every 30-odd seconds. */}
        <motion.g
          data-motion="decorative"
          animate={reduced ? undefined : { rotate: 360 }}
          transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "320px 165px" }}
        >
          <ellipse
            cx="320"
            cy="165"
            rx="84"
            ry="30"
            fill="none"
            stroke="var(--color-ink-500)"
            strokeWidth="1"
            strokeDasharray="4 7"
            opacity="0.75"
          />
          <circle cx="404" cy="165" r="3" fill="var(--color-aqua-400)" />
        </motion.g>

        <motion.g
          data-motion="decorative"
          animate={reduced ? undefined : { rotate: -360 }}
          transition={{ duration: 46, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "320px 165px" }}
        >
          <ellipse
            cx="320"
            cy="165"
            rx="30"
            ry="84"
            fill="none"
            stroke="var(--color-ink-500)"
            strokeWidth="1"
            strokeDasharray="4 7"
            opacity="0.6"
          />
          <circle cx="320" cy="81" r="2.5" fill="var(--color-azure-300)" />
        </motion.g>

        {/* Hexagonal gateway core */}
        <g>
          <polygon
            points="320,117 361,141 361,189 320,213 279,189 279,141"
            fill="var(--color-ink-850)"
            stroke="url(#hv-core)"
            strokeWidth="1.75"
          />
          <polygon
            points="320,133 347,149 347,181 320,197 293,181 293,149"
            fill="none"
            stroke="var(--color-azure-400)"
            strokeWidth="1"
            opacity="0.45"
          />
          <motion.circle
            data-motion="decorative"
            cx="320"
            cy="165"
            r="6"
            fill="url(#hv-core)"
            animate={reduced ? undefined : { opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <text
            x="320"
            y="243"
            textAnchor="middle"
            fill="var(--color-mist-400)"
            fontSize="10.5"
            fontFamily="var(--font-mono)"
            letterSpacing="2"
          >
            GATEWAY
          </text>
        </g>

        {/* ---- synthetic status strip --------------------------------
            Deliberately generic placeholder values. Nothing here is a real
            measurement and nothing is presented as one. */}
        <g opacity="0.7">
          <rect
            x="196"
            y="283"
            width="248"
            height="30"
            rx="8"
            fill="var(--color-ink-850)"
            stroke="var(--color-ink-700)"
          />
          <circle cx="214" cy="298" r="3" fill="var(--color-jade-400)" />
          <text
            x="226"
            y="302"
            fill="var(--color-mist-400)"
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            consent · verified
          </text>
          <text
            x="352"
            y="302"
            fill="var(--color-mist-500)"
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            retry · bounded
          </text>
        </g>
      </svg>
    </div>
  );
}
