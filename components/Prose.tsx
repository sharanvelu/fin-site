import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./icons";

/** Page title + lead paragraph for a docs page. */
export function PageHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mb-10">
      <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{title}</h1>
      {lead && <p className="mt-4 text-lg leading-relaxed text-fg-muted">{lead}</p>}
    </div>
  );
}

/** An <h2> with a hover anchor link. */
export function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="group mt-14 mb-4 scroll-mt-24 flex items-center gap-2 text-2xl font-semibold tracking-tight text-fg"
    >
      {children}
      <a href={`#${id}`} className="anchor-link text-fg-faint hover:text-accent" aria-label="Link to section">
        <Icon.link className="h-4 w-4" />
      </a>
    </h2>
  );
}

export function H3({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} className="mt-9 mb-3 scroll-mt-24 text-lg font-semibold text-fg">
      {children}
    </h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="my-4 leading-relaxed text-fg-muted">{children}</p>;
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="my-4 text-lg leading-relaxed text-fg-muted">{children}</p>;
}

type CalloutKind = "info" | "warn" | "tip";
const CALLOUT_STYLES: Record<CalloutKind, { border: string; bg: string; label: string; dot: string }> = {
  info: { border: "border-term-cyan/30", bg: "bg-term-cyan/5", label: "text-term-cyan", dot: "ℹ" },
  warn: { border: "border-term-yellow/30", bg: "bg-term-yellow/5", label: "text-term-yellow", dot: "⚠" },
  tip: { border: "border-accent/30", bg: "bg-accent/5", label: "text-accent", dot: "✓" },
};

export function Callout({
  kind = "info",
  title,
  children,
}: {
  kind?: CalloutKind;
  title?: string;
  children: ReactNode;
}) {
  const s = CALLOUT_STYLES[kind];
  return (
    <div className={`my-5 rounded-card border ${s.border} ${s.bg} px-4 py-3`}>
      <div className="flex gap-3">
        <span className={`${s.label} font-mono`}>{s.dot}</span>
        <div className="text-sm leading-relaxed text-fg-muted">
          {title && <p className={`mb-1 font-semibold ${s.label}`}>{title}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

/** Simple two/three column reference table. */
export function RefTable({
  head,
  rows,
}: {
  head: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="my-6 overflow-x-auto rounded-card border border-border">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-panel/60">
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-semibold text-fg">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border-soft last:border-0 hover:bg-panel/30">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 align-top text-fg-muted">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Inline code token. */
export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded border border-border-soft bg-accent-soft px-1.5 py-0.5 font-mono text-[0.85em] text-accent">
      {children}
    </code>
  );
}

/** Previous / next pager at the bottom of a doc page. */
export function Pager({
  prev,
  next,
}: {
  prev?: { title: string; href: string };
  next?: { title: string; href: string };
}) {
  return (
    <div className="mt-16 flex items-stretch justify-between gap-4 border-t border-border-soft pt-8">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex flex-1 flex-col rounded-card border border-border p-4 transition hover:border-accent"
        >
          <span className="text-xs text-fg-faint">Previous</span>
          <span className="mt-1 font-medium text-fg group-hover:text-accent">{prev.title}</span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group flex flex-1 flex-col items-end rounded-card border border-border p-4 text-right transition hover:border-accent"
        >
          <span className="text-xs text-fg-faint">Next</span>
          <span className="mt-1 font-medium text-fg group-hover:text-accent">{next.title}</span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
