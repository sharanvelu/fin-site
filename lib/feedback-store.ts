/**
 * DB access for feedback rows (server-only). All queries are parameterized
 * via the Neon tagged-template client from lib/db.ts.
 */
import { db } from "./db";
import type { RequestType, Status, Submission } from "./feedback";

export type FeedbackRow = {
  id: number;
  type: RequestType;
  title: string;
  name: string | null;
  email: string | null;
  details: Record<string, string>;
  status: Status;
  created_at: Date;
  updated_at: Date;
};

export async function insertFeedback(submission: Submission): Promise<void> {
  await db()`
    INSERT INTO feedback (type, title, name, email, details)
    VALUES (
      ${submission.type},
      ${submission.title},
      ${submission.name},
      ${submission.email},
      ${JSON.stringify(submission.details)}::jsonb
    )
  `;
}

export async function listFeedback(type: RequestType): Promise<FeedbackRow[]> {
  return (await db()`
    SELECT * FROM feedback WHERE type = ${type} ORDER BY created_at DESC
  `) as FeedbackRow[];
}

export async function getFeedback(id: number): Promise<FeedbackRow | null> {
  const rows = (await db()`
    SELECT * FROM feedback WHERE id = ${id}
  `) as FeedbackRow[];
  return rows[0] ?? null;
}

export async function updateFeedbackStatus(
  id: number,
  status: Status,
): Promise<void> {
  await db()`
    UPDATE feedback SET status = ${status}, updated_at = now() WHERE id = ${id}
  `;
}

/** Per-type totals plus open (not resolved/closed) counts for the overview. */
export async function feedbackCounts(): Promise<
  Record<RequestType, { total: number; open: number }>
> {
  const rows = (await db()`
    SELECT
      type,
      count(*)::int AS total,
      count(*) FILTER (WHERE status NOT IN ('resolved', 'closed'))::int AS open
    FROM feedback GROUP BY type
  `) as { type: RequestType; total: number; open: number }[];
  const counts = {} as Record<RequestType, { total: number; open: number }>;
  for (const row of rows) {
    counts[row.type] = { total: row.total, open: row.open };
  }
  return counts;
}
