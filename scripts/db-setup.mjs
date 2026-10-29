/**
 * One-time NeonDB setup for the feedback system and admin panel.
 *
 * Usage: npm run db:setup   (reads .env via node --env-file)
 *
 * Creates the feedback / users / admin_sessions tables (idempotent). Users
 * are created on first OIDC login; promote the first admin with SQL (printed
 * at the end).
 */
import { neon } from "@neondatabase/serverless";

const { DATABASE_URL } = process.env;

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
  `CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    issuer TEXT NOT NULL,
    subject TEXT NOT NULL,
    email TEXT,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (
      role IN ('admin', 'editor', 'member')
    ),
    disabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ,
    UNIQUE (issuer, subject)
  )`,
  `CREATE INDEX IF NOT EXISTS users_email_idx ON users (lower(email))`,
  `CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS admin_sessions_expires_idx
    ON admin_sessions (expires_at)`,
];

for (const statement of STATEMENTS) {
  await sql.query(statement);
}
console.log("Tables ready: feedback, users, admin_sessions.");
console.log(
  "Sign in once via OIDC, then promote the first admin:\n" +
    "  UPDATE users SET role = 'admin' WHERE email = 'you@example.com';",
);
