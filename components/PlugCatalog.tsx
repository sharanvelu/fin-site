"use client";

import Link from "next/link";
import { useState } from "react";
import { PLUGS } from "@/lib/plugs";

/**
 * Searchable table of every catalog plug, linking to /docs/plugs/<slug>.
 * Client component only because of the search field — the data is static.
 */
export function PlugCatalog() {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const matches = q
    ? PLUGS.filter((p) =>
        [p.slug, p.title, p.type, p.summary, ...p.commands.map((c) => c.name)]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : PLUGS;

  return (
    <div className="my-6">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search plugs by name, type, or command…"
        aria-label="Search plugs"
        className="mb-3 w-full rounded-lg border border-border bg-panel/50 px-4 py-2 font-mono text-sm text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none"
      />
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-panel/60">
              <th className="px-4 py-2.5 font-semibold text-fg">Plug</th>
              <th className="px-4 py-2.5 font-semibold text-fg">Type</th>
              <th className="px-4 py-2.5 font-semibold text-fg">Description</th>
              <th className="px-4 py-2.5 font-semibold text-fg">Commands</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((p) => (
              <tr
                key={p.slug}
                className="border-b border-border-soft last:border-0 hover:bg-panel/30"
              >
                <td className="px-4 py-2.5 align-top">
                  <Link
                    href={`/docs/plugs/${p.slug}`}
                    className="font-mono text-accent hover:underline"
                  >
                    {p.slug}
                  </Link>
                </td>
                <td className="px-4 py-2.5 align-top">
                  <span
                    className={`rounded border px-1.5 py-0.5 font-mono text-xs ${
                      p.type === "APP"
                        ? "border-accent/30 bg-accent/10 text-accent"
                        : "border-term-green/30 bg-term-green/10 text-term-green"
                    }`}
                  >
                    {p.type}
                  </span>
                </td>
                <td className="px-4 py-2.5 align-top text-fg-muted">
                  {p.summary}
                </td>
                <td className="px-4 py-2.5 align-top font-mono text-xs text-fg-faint">
                  {p.commands.length > 0
                    ? p.commands.map((c) => c.name).join(", ")
                    : "—"}
                </td>
              </tr>
            ))}
            {matches.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-fg-faint">
                  No plugs match &quot;{query}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
