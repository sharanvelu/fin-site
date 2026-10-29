/**
 * One-time NeonDB setup for the feedback system.
 *
 * Usage: npm run db:setup   (reads .env via node --env-file)
 *
 * Creates the feedback / admins / admin_sessions tables (idempotent) and
 * seeds or updates the admin user from ADMIN_USERNAME / ADMIN_PASSWORD.
 */
import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync } from "node:crypto";

const { DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set — add it to .env first.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS feedback (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type TEXT NOT NULL CHECK (
      type IN ('feedback', 'issue', 'feature-request', 'proposing-change')
    ),
    title TEXT NOT NULL,
    name TEXT,
    email TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'new' CHECK (
      status IN ('new', 'in-review', 'planned', 'in-progress', 'resolved', 'closed')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS feedback_type_created_idx
    ON feedback (type, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS admins (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY,
    admin_id BIGINT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS admin_sessions_expires_idx
    ON admin_sessions (expires_at)`,
];

// Must stay in sync with hashPassword/verifyPassword in lib/auth.ts.
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

for (const statement of STATEMENTS) {
  await sql.query(statement);
}
console.log("Tables ready: feedback, admins, admin_sessions.");

if (ADMIN_USERNAME && ADMIN_PASSWORD) {
  await sql.query(
    `INSERT INTO admins (username, password_hash) VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [ADMIN_USERNAME, hashPassword(ADMIN_PASSWORD)],
  );
  console.log(
    `Admin user "${ADMIN_USERNAME}" seeded (password updated if it existed).`,
  );
} else {
  console.log(
    "ADMIN_USERNAME / ADMIN_PASSWORD not set — skipped admin seeding.",
  );
}
