import type { ProjectKind, ProjectStatus } from "@/data/types";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

/**
 * Status vocabulary, rendered consistently everywhere.
 *
 * The labels are chosen to be unambiguous to a recruiter skimming: "In
 * development" cannot be misread as finished, and nothing says "live" unless a
 * demo URL actually exists. The `title` text spells out the meaning for anyone
 * who hovers.
 */
const STATUS: Record<
  ProjectStatus,
  { label: string; icon: string; className: string; title: string }
> = {
  complete: {
    label: "Complete",
    icon: "CircleCheck",
    className: "border-jade-400/30 bg-jade-400/10 text-jade-400",
    title: "Feature-complete, tests passing.",
  },
  maintained: {
    label: "Maintained",
    icon: "GitBranch",
    className: "border-azure-500/30 bg-azure-500/10 text-azure-300",
    title: "Actively worked on and kept current.",
  },
  "in-development": {
    label: "In development",
    icon: "Clock",
    className: "border-amber-glow/30 bg-amber-glow/10 text-amber-glow",
    title: "Work in progress — not finished and not deployed.",
  },
  planned: {
    label: "Planned",
    icon: "CircleDot",
    className: "border-ink-600 bg-ink-800/70 text-mist-500",
    title: "Scoped but not started.",
  },
};

const KIND: Record<ProjectKind, { label: string; icon: string; className: string; title: string }> =
  {
    professional: {
      label: "Professional",
      icon: "Building2",
      className: "border-iris-500/30 bg-iris-500/10 text-iris-300",
      title:
        "Employer-owned work, described rather than published. No source code or internal detail is shown.",
    },
    independent: {
      label: "Independent",
      icon: "Code2",
      className: "border-ink-600/70 bg-ink-800/70 text-mist-300",
      title: "A personally owned, public repository.",
    },
  };

const BASE =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-label " +
  "tracking-wide whitespace-nowrap";

export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  const config = STATUS[status];
  return (
    <span className={cn(BASE, config.className, className)} title={config.title}>
      <Icon name={config.icon} size={12} />
      {config.label}
    </span>
  );
}

export function KindBadge({ kind, className }: { kind: ProjectKind; className?: string }) {
  const config = KIND[kind];
  return (
    <span className={cn(BASE, config.className, className)} title={config.title}>
      <Icon name={config.icon} size={12} />
      {config.label}
    </span>
  );
}
