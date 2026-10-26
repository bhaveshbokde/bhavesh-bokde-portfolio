"use client";

import { useId, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

export interface DisclosureProps {
  /** Label when collapsed. */
  showLabel: string;
  /** Label when expanded. */
  hideLabel: string;
  children: ReactNode;
}

/**
 * A minimal show/hide control.
 *
 * The content is unmounted when collapsed rather than hidden with CSS, so a
 * screen reader never reads paragraphs that are visually absent, and the
 * collapsed state costs nothing to render.
 *
 * `aria-expanded` and `aria-controls` are wired to a generated id, so assistive
 * technology announces the state and knows which region the button governs.
 */
export function Disclosure({ showLabel, hideLabel, children }: DisclosureProps) {
  const [open, setOpen] = useState(false);
  const regionId = useId();

  return (
    <div>
      {open && (
        <div id={regionId} className="space-y-5">
          {children}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={regionId}
        className="group mt-5 inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-850/60 px-4 py-2 text-sm text-mist-300 transition-colors hover:border-azure-500/50 hover:text-white"
      >
        {open ? hideLabel : showLabel}
        <Icon
          name="ChevronDown"
          size={15}
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}
