import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { REQUEST_TYPE_DEFS } from "@/lib/feedback";
import { feedbackCounts } from "@/lib/feedback-store";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const counts = await feedbackCounts();

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-fg">Dashboard</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Everything submitted through the feedback form, grouped by request type.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REQUEST_TYPE_DEFS.map((def) => {
          const count = counts[def.slug] ?? { total: 0, open: 0 };
          return (
            <Link
              key={def.slug}
              href={`/ap/${def.slug}`}
              className="group rounded-card border border-border bg-panel p-5 transition hover:border-accent"
            >
              <p className="text-sm font-semibold text-fg group-hover:text-accent">
                {def.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                {def.blurb}
              </p>
              <p className="mt-4 font-mono text-2xl text-fg">
                {count.open}
                <span className="ml-2 text-sm text-fg-faint">
                  open / {count.total} total
                </span>
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
