import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import {
  formatTimestamp,
  getRequestTypeDef,
  isRequestType,
} from "@/lib/feedback";
import { listFeedback } from "@/lib/feedback-store";

export default async function AdminListPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isRequestType(type)) notFound();
  await requireAdmin();

  const def = getRequestTypeDef(type);
  const rows = await listFeedback(type);

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-fg">
          {def.label}
        </h1>
        <p className="font-mono text-sm text-fg-faint">
          {rows.length} {rows.length === 1 ? "entry" : "entries"}
        </p>
      </div>
      <p className="mt-2 text-sm text-fg-muted">{def.blurb}</p>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-card border border-border bg-panel/50 p-10 text-center text-sm text-fg-muted">
          Nothing here yet — submissions of this type will show up here.
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-card border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-panel/60">
                <th className="px-4 py-2.5 font-semibold text-fg">#</th>
                <th className="px-4 py-2.5 font-semibold text-fg">Title</th>
                <th className="px-4 py-2.5 font-semibold text-fg">From</th>
                <th className="px-4 py-2.5 font-semibold text-fg">Status</th>
                <th className="px-4 py-2.5 font-semibold text-fg">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border-soft last:border-0 hover:bg-panel/30"
                >
                  <td className="px-4 py-2.5 font-mono text-fg-faint">
                    {row.id}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/ap/${type}/${row.id}`}
                      className="font-medium text-fg hover:text-accent"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-fg-muted">
                    {row.name ?? "Anonymous"}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-fg-faint">
                    {formatTimestamp(row.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
