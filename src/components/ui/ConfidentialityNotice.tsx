import { Icon } from "./Icon";

/**
 * The notice shown on employer-owned work.
 *
 * Rendered prominently rather than tucked into a footnote, and the validation
 * in `src/lib/validate.ts` makes it mandatory for any project with
 * `kind: "professional"` — so a new office project cannot be added without
 * one, even by accident.
 */
export function ConfidentialityNotice({ note }: { note: string }) {
  return (
    <aside
      aria-label="Confidentiality notice"
      className="relative overflow-hidden rounded-xl border border-iris-500/25 bg-iris-500/[0.055] p-5 md:p-6"
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-iris-400/70 to-transparent"
      />
      <div className="flex gap-4">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-iris-500/30 bg-iris-500/10">
          <Icon name="Lock" size={15} className="text-iris-300" />
        </span>
        <div>
          <h3 className="font-mono text-[11px] tracking-[0.2em] text-iris-300 uppercase">
            Professional work · what is shown
          </h3>
          <p className="mt-2.5 text-sm leading-relaxed text-mist-400">{note}</p>
        </div>
      </div>
    </aside>
  );
}
