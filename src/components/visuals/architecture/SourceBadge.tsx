import { SOURCE_LABEL, SOURCE_NOTE, type Source } from "@/data/architecture";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

const STYLE: Record<Source, { className: string; icon: string }> = {
  spec: {
    className: "border-azure-500/35 bg-azure-500/10 text-azure-300",
    icon: "FileText",
  },
  implementation: {
    className: "border-iris-500/35 bg-iris-500/10 text-iris-300",
    icon: "Building2",
  },
  illustrative: {
    className: "border-amber-glow/35 bg-amber-glow/10 text-amber-glow",
    icon: "Info",
  },
};

/**
 * The provenance badge.
 *
 * Every claim in the case study is one of three things: defined by the public
 * ReBIT specification, an AAConnect orchestration responsibility, or an
 * illustrative sketch that cannot be independently verified. Mixing those
 * three without saying which is which is how a portfolio quietly overstates —
 * so the distinction is rendered, not just intended.
 *
 * The `title` carries the full explanation, so hovering any badge says what
 * that category actually means.
 */
export function SourceBadge({
  source,
  size = "md",
  className,
}: {
  source: Source;
  size?: "sm" | "md";
  className?: string;
}) {
  const style = STYLE[source];
  return (
    <span
      title={SOURCE_NOTE[source]}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-mono tracking-wide whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        style.className,
        className,
      )}
    >
      <Icon name={style.icon} size={size === "sm" ? 10 : 11} />
      {SOURCE_LABEL[source]}
    </span>
  );
}
