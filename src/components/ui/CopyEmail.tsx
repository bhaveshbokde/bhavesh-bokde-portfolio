"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

type State = "idle" | "copied" | "failed";

/**
 * Copy-the-email-address control.
 *
 * Small, but it is the one genuinely useful interaction a contact section can
 * offer: the common case is someone who wants the address in their own mail
 * client, and selecting a mailto link by dragging is a worse experience than
 * one button.
 *
 * Accessibility details that matter here:
 *
 * - The result is announced. A visual tick is invisible to a screen reader, so
 *   the outcome is written into a `role="status"` region that is permanently
 *   in the DOM — a live region inserted at the same moment its text changes is
 *   frequently missed, because the assistive technology never saw it empty.
 * - The button keeps one stable accessible name rather than relabelling itself
 *   to "Copied". A control whose name changes under the user is a control they
 *   can no longer refer to.
 * - Failure is reported, not swallowed. `writeText` rejects without a user
 *   gesture, over plain HTTP, and under some permission policies; silently
 *   doing nothing would leave the visitor believing they had the address.
 *
 * The timeout is cleared on unmount so the component cannot set state after it
 * has gone away.
 */
export function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(email);
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), 2400);
  };

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy email address ${email} to clipboard`}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-control border px-3 font-mono text-label tracking-label uppercase transition-all duration-300",
          "active:scale-[0.97] active:duration-75",
          state === "copied"
            ? "border-jade-400/40 bg-jade-400/10 text-jade-400"
            : state === "failed"
              ? "border-amber-glow/40 bg-amber-glow/10 text-amber-glow"
              : "border-ink-600 bg-ink-850/60 text-mist-400 hover:border-azure-500/50 hover:text-mist-100",
        )}
      >
        <Icon
          name={state === "copied" ? "Check" : state === "failed" ? "Info" : "Copy"}
          size={13}
        />
        {state === "copied" ? "Copied" : state === "failed" ? "Failed" : "Copy"}
      </button>

      {/* Always present, so the announcement lands. */}
      <span role="status" aria-live="polite" className="sr-only">
        {state === "copied"
          ? "Email address copied to clipboard"
          : state === "failed"
            ? "Could not copy. Select the address and copy it manually."
            : ""}
      </span>
    </>
  );
}
