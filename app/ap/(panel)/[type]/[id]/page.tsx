import Link from "next/link";
import { notFound } from "next/navigation";
import { updateStatus } from "@/app/ap/actions";
import { StatusBadge } from "@/components/StatusBadge";
import { requireEditor } from "@/lib/auth";
import {
  STATUSES,
  STATUS_META,
  formatTimestamp,
  getRequestTypeDef,
  isRequestType,
} from "@/lib/feedback";
import { getFeedback } from "@/lib/feedback-store";

export default async function AdminDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  const numericId = Number(id);
  if (!isRequestType(type) || !Number.isInteger(numericId) || numericId <= 0) {
    notFound();
  }
  await requireEditor();

  const row = await getFeedback(numericId);
  if (!row || row.type !== type) notFound();

  const def = getRequestTypeDef(type);

  return (
    <>
      <Link
        href={`/ap/${type}`}
        className="text-sm text-fg-muted transition hover:text-accent"
      >
        ← Back to {def.label.toLowerCase()}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm text-fg-faint">#{row.id}</span>
        <StatusBadge status={row.status} />
      </div>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-fg">
        {row.title}
      </h1>

      {/* Submission meta */}
      <div className="mt-6 grid grid-cols-1 gap-4 rounded-card border border-border bg-panel/50 p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs text-fg-faint">Submitted by</p>
          <p className="mt-0.5 text-fg">
            {row.name ?? "Anonymous"}
            {row.email && (
              <a
                href={`mailto:${row.email}`}
                className="ml-2 text-accent hover:underline"
              >
                {row.email}
              </a>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-fg-faint">Submitted / last updated</p>
          <p className="mt-0.5 font-mono text-xs text-fg-muted">
            {formatTimestamp(row.created_at)} ·{" "}
            {formatTimestamp(row.updated_at)}
          </p>
        </div>
      </div>

      {/* Type-specific fields */}
      <div className="mt-6 space-y-5">
        {def.fields.map((field) => {
          const value = row.details[field.key];
          if (!value) return null;
          return (
            <div key={field.key}>
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-faint">
                {field.label}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap rounded-lg border border-border-soft bg-panel/40 px-3.5 py-2.5 text-sm leading-relaxed text-fg-muted">
                {value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Status update */}
      <form
        action={updateStatus}
        className="mt-8 flex flex-wrap items-end gap-3 rounded-card border border-border bg-panel p-4"
      >
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="type" value={row.type} />
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-faint">
            Status
          </span>
          <select
            name="status"
            defaultValue={row.status}
            className="rounded-lg border border-border bg-bg-soft px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_META[status].label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition hover:bg-accent-strong"
        >
          Update status
        </button>
      </form>
    </>
  );
}
