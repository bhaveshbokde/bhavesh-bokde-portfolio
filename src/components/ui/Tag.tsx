import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TagProps {
  children: ReactNode;
  variant?: "default" | "accent" | "outline" | "muted";
  size?: "sm" | "md";
  className?: string;
  title?: string;
}

const VARIANTS = {
  default:
    "border-ink-600/70 bg-ink-800/70 text-mist-300",
  accent:
    "border-azure-500/30 bg-azure-500/10 text-azure-300",
  outline:
    "border-ink-600 bg-transparent text-mist-400",
  muted:
    "border-ink-700/60 bg-ink-900/60 text-mist-500",
} as const;

const SIZES = {
  sm: "px-2.5 py-1 text-[11px]",
  md: "px-3 py-1.5 text-xs",
} as const;

/** A technology or category chip. Inline, non-interactive by design. */
export function Tag({
  children,
  variant = "default",
  size = "sm",
  className,
  title,
}: TagProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-mono tracking-wide whitespace-nowrap",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
