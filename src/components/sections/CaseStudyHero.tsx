import type { Project } from "@/data/types";
import { LIFECYCLE } from "@/data/architecture";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { KindBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { FlowBackdrop } from "@/components/visuals/FlowBackdrop";

/**
 * The hero for a professional case study.
 *
 * It leads with the one sentence that the old version of this page got wrong —
 * that AAConnect is a Technology Service Provider, not the Account Aggregator
 * and not a gateway to banks. If a reader takes nothing else away, it should
 * be that.
 *
 * The confidentiality disclaimer sits in the hero rather than at the bottom.
 * A notice that only appears after a visitor has read the whole page has
 * arrived too late to be a disclaimer.
 */
export function CaseStudyHero({ project }: { project: Project }) {
  const stageCount = LIFECYCLE.length;

  return (
    <header className="relative overflow-hidden">
      <FlowBackdrop />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2.5">
          <KindBadge kind={project.kind} />
          <StatusBadge status={project.status} />
          <span className="font-mono text-[11px] tracking-wide text-mist-500">
            {project.category}
          </span>
        </div>

        <h1 className="mt-6 text-[length:var(--text-display)] leading-[1.02] font-semibold">
          <span className="text-gradient">{project.name}</span>
        </h1>

        {/* The positioning line. This is the correction, stated plainly. */}
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-mist-200 md:text-xl">
          A <strong className="font-semibold text-mist-50">Technology Service
          Provider</strong> layer that client Financial Information Users
          integrate through to reach India&apos;s RBI-regulated Account
          Aggregator ecosystem — orchestrating consent, asynchronous
          notifications, encrypted data retrieval and downstream analysis
          behind one integration.
        </p>

        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-mist-400">
          It is <em className="text-mist-300 not-italic">not</em> the Account
          Aggregator, and not a gateway that reaches banks directly. The
          aggregator owns the user&apos;s consent journey; AAConnect orchestrates
          everything around it.
        </p>

        {/* ---- end-to-end summary ---- */}
        <ol className="mt-8 flex flex-wrap items-center gap-x-1.5 gap-y-2 font-mono text-[11px] text-mist-500">
          {[
            "client request",
            "consent handle",
            "user approves at the AA",
            "async notification",
            "FI request",
            "fetch encrypted",
            "decrypt",
            "analyse",
            "result",
          ].map((step, index, all) => (
            <li key={step} className="flex items-center gap-1.5">
              <span className="rounded border border-ink-700/70 bg-ink-850/50 px-2 py-1">
                {step}
              </span>
              {index < all.length - 1 && (
                <Icon name="ArrowRight" size={11} className="text-mist-700 opacity-50" />
              )}
            </li>
          ))}
        </ol>

        {/* ---- actions ---- */}
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="#architecture" variant="primary" size="lg">
            <Icon name="Network" size={16} />
            Explore the architecture
          </ButtonLink>
          <ButtonLink href="/#projects" variant="secondary" size="lg">
            <Icon name="ArrowRight" size={15} className="rotate-180" />
            All projects
          </ButtonLink>
        </div>

        {/* ---- what the reader is looking at ---- */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <HeroFact
            icon="Workflow"
            label="Lifecycle"
            value={`${stageCount} stages`}
            note="client request through to delivered analysis"
          />
          <HeroFact
            icon="FileText"
            label="Protocol source"
            value="ReBIT AA 2.0.0"
            note="operation and field names read from the spec"
          />
          <HeroFact
            icon="Lock"
            label="Scope"
            value="Illustrative"
            note="no proprietary implementation detail"
          />
        </div>

        {/* ---- disclaimer, up front ---- */}
        <aside
          aria-label="Scope and confidentiality"
          className="mt-8 flex gap-3.5 rounded-xl border border-iris-500/25 bg-iris-500/[0.05] p-5"
        >
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-iris-500/30 bg-iris-500/10">
            <Icon name="Lock" size={15} className="text-iris-300" />
          </span>
          <div>
            <h2 className="font-mono text-[11px] tracking-[0.2em] text-iris-300 uppercase">
              What this page is
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-mist-400">
              A high-level, illustrative account of my engineering
              responsibilities on an employer-owned platform — built from the
              publicly published ReBIT specifications and generic integration
              patterns. It does not reproduce any production architecture.
              There is no source code, no internal endpoint, service name or
              topology, no credentials or keys, and no customer, consent or
              account data. Where a detail is internal it has been left out
              rather than approximated, and every claim on this page is labelled
              with where it comes from.
            </p>
          </div>
        </aside>

        {/* ---- stack ---- */}
        <ul className="mt-8 flex flex-wrap gap-2">
          {project.stack.map((technology) => (
            <li key={technology}>
              <Tag>{technology}</Tag>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

function HeroFact({
  icon,
  label,
  value,
  note,
}: {
  icon: string;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="surface-card p-4">
      <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-mist-600 uppercase">
        <Icon name={icon} size={11} className="text-azure-400" />
        {label}
      </p>
      <p className="mt-2 font-display text-base font-semibold text-mist-50">{value}</p>
      <p className="mt-1 text-[11px] leading-snug text-mist-500">{note}</p>
    </div>
  );
}
