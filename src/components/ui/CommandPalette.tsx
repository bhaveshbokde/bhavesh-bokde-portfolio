"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

export interface Command {
  id: string;
  label: string;
  /** Extra words that should match this command when typed. */
  keywords?: string;
  icon: string;
  group: string;
  /** In-page anchor, route, or absolute URL. */
  href: string;
  external?: boolean;
  download?: string;
  hint?: string;
}

export interface CommandPaletteProps {
  commands: Command[];
}

/**
 * Case-insensitive subsequence match — "sb" finds "Spring Boot", "dres" finds
 * "Download resume".
 *
 * Only ever applied to short labels. Run across a long string it matches
 * almost anything: "finsight" is a subsequence of a hundred characters of
 * comma-separated stack names, which is how typing a project's exact name
 * ended up returning two results.
 */
function matchesLabel(haystack: string, needle: string): boolean {
  if (!needle) return true;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  let i = 0;
  for (const char of h) {
    if (char === n[i]) i += 1;
    if (i === n.length) return true;
  }
  return false;
}

/** Plain substring match, for the long keyword blobs where subsequence is noise. */
function matchesKeywords(haystack: string, needle: string): boolean {
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/**
 * A ⌘K / Ctrl-K command palette.
 *
 * Accessibility is the whole point of building this rather than installing one:
 *
 * - The input owns focus and uses `aria-activedescendant`, so the caret never
 *   leaves the textbox while the arrow keys move the highlighted option. That
 *   is the WAI-ARIA combobox pattern; moving real DOM focus into the list
 *   instead would break typing.
 * - The listbox/option roles are real, each option has a stable id, and the
 *   active one is scrolled into view.
 * - Escape closes, focus returns to whatever was focused before opening, Tab
 *   is trapped, and the page behind is inert to scrolling.
 * - A live region announces the result count as you type.
 *
 * The trigger is ⌘K on Apple platforms and Ctrl-K elsewhere, detected from the
 * event rather than from the user agent: `metaKey` is Command on macOS and the
 * Windows key elsewhere, so checking both and letting the platform decide is
 * more reliable than sniffing.
 */
export function CommandPalette({ commands }: CommandPaletteProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim();
    return commands.filter(
      (command) =>
        matchesLabel(command.label, q) ||
        matchesLabel(command.group, q) ||
        (command.keywords ? matchesKeywords(command.keywords, q) : false),
    );
  }, [commands, query]);

  /* Group the filtered results, preserving command order within each group. */
  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const command of results) {
      const list = map.get(command.group) ?? [];
      list.push(command);
      map.set(command.group, list);
    }
    return [...map.entries()];
  }, [results]);

  /* A flat view matching render order, so arrow keys and rendering agree. */
  const flat = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  // Closing only flips state. Focus restoration happens in the open-effect's
  // cleanup below, which captures whatever was focused at open time — so no
  // callback has to read a ref, and the "where did focus come from" question
  // has exactly one answer.
  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const run = useCallback(
    (command: Command) => {
      close();

      if (command.external) {
        window.open(command.href, "_blank", "noopener,noreferrer");
        return;
      }

      if (command.download) {
        const anchor = document.createElement("a");
        anchor.href = command.href;
        anchor.download = command.download;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        return;
      }

      if (command.href.startsWith("#")) {
        // Let the dialog unmount before scrolling, or the scroll lock below
        // is still in effect and the jump silently does nothing.
        requestAnimationFrame(() => {
          document
            .querySelector(command.href)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.replaceState(null, "", command.href);
        });
        return;
      }

      router.push(command.href);
    },
    [close, router],
  );

  /* --- global shortcut -------------------------------------------- */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isK = event.key === "k" || event.key === "K";
      if (isK && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      // "/" is the other convention, but only when not already typing.
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if (event.key === "/" && !typing && !open) {
        event.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  /* --- focus, scroll lock, tab trap -------------------------------- */
  useEffect(() => {
    if (!open) return;

    // Captured once, at open time — restored in this effect's cleanup.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'input, button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  /**
   * The highlight is clamped during render rather than corrected in an effect.
   *
   * Typing can shrink the list under a stored index. Fixing that with
   * `setActiveIndex` inside an effect means rendering once with an index that
   * points past the end, then re-rendering — the cascading-render pattern React
   * warns about. Deriving the safe value costs nothing and is always correct on
   * the first pass.
   */
  const activeIndexSafe = activeIndex >= flat.length ? 0 : activeIndex;

  /* Keep the highlighted option visible. */
  useEffect(() => {
    const active = flat[activeIndexSafe];
    if (!active || !listRef.current) return;
    listRef.current
      .querySelector(`#cmd-${active.id}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndexSafe, flat]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (flat.length === 0 ? 0 : (i + 1) % flat.length));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (flat.length === 0 ? 0 : (i - 1 + flat.length) % flat.length));
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(Math.max(0, flat.length - 1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const command = flat[activeIndexSafe];
      if (command) run(command);
    }
  };

  const activeId = flat[activeIndexSafe] ? `cmd-${flat[activeIndexSafe]!.id}` : undefined;

  return (
    <>
      {/* The discoverable trigger. A palette nobody knows about is not a
          feature, so there is a visible affordance showing the shortcut. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group hidden items-center gap-2 rounded-lg border border-ink-600 bg-ink-850/70 py-2 pr-2 pl-3 text-sm text-mist-500 transition-colors hover:border-azure-500/50 hover:text-mist-200 md:inline-flex"
        aria-label="Open command palette. Keyboard shortcut: Control or Command plus K."
      >
        <Icon name="Terminal" size={14} />
        <span className="pr-6">Jump to…</span>
        <kbd className="rounded border border-ink-600 bg-ink-900 px-1.5 py-0.5 font-mono text-[10px] text-mist-500 group-hover:border-ink-500">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]"
          role="presentation"
        >
          <div
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-ink-600 bg-ink-900/95 shadow-[0_32px_90px_-24px_rgb(0_0_0/0.9)] backdrop-blur-xl"
          >
            {/* --- input --- */}
            <div className="flex items-center gap-3 border-b border-ink-700 px-4">
              <Icon name="Terminal" size={16} className="shrink-0 text-azure-400" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls="command-list"
                aria-activedescendant={activeId}
                aria-autocomplete="list"
                aria-label="Search commands"
                placeholder="Jump to a section, open a link, download the resume…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onInputKeyDown}
                className="h-14 w-full bg-transparent text-[15px] text-mist-100 outline-none placeholder:text-mist-600"
              />
              <kbd className="shrink-0 rounded border border-ink-600 bg-ink-850 px-1.5 py-0.5 font-mono text-[10px] text-mist-500">
                esc
              </kbd>
            </div>

            {/* --- results --- */}
            <div
              ref={listRef}
              id="command-list"
              role="listbox"
              aria-label="Commands"
              className="max-h-[52vh] overflow-y-auto p-2"
            >
              {flat.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-mist-500">
                  Nothing matches “{query}”.
                </p>
              ) : (
                grouped.map(([group, items]) => (
                  <div key={group} className="mb-1">
                    <p
                      className="px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-mist-600 uppercase"
                      aria-hidden="true"
                    >
                      {group}
                    </p>
                    {items.map((command) => {
                      const index = flat.indexOf(command);
                      const isActive = index === activeIndexSafe;
                      return (
                        <div
                          key={command.id}
                          id={`cmd-${command.id}`}
                          role="option"
                          aria-selected={isActive}
                          onClick={() => run(command)}
                          onMouseMove={() => setActiveIndex(index)}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                            isActive
                              ? "bg-azure-500/12 text-white"
                              : "text-mist-300 hover:bg-ink-800",
                          )}
                        >
                          <Icon
                            name={command.icon}
                            size={15}
                            className={isActive ? "text-azure-300" : "text-mist-500"}
                          />
                          <span className="flex-1">{command.label}</span>
                          {command.hint && (
                            <span className="font-mono text-[10px] text-mist-600">
                              {command.hint}
                            </span>
                          )}
                          {command.external && (
                            <Icon
                              name="ArrowUpRight"
                              size={13}
                              className="text-mist-600"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* --- footer --- */}
            <div className="flex items-center justify-between gap-3 border-t border-ink-700 px-4 py-2.5">
              <p className="flex items-center gap-3 font-mono text-[10px] text-mist-600">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
                <span>esc close</span>
              </p>
              <p aria-live="polite" className="font-mono text-[10px] text-mist-600">
                {flat.length} result{flat.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
