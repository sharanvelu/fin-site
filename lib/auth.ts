/**
 * Admin auth for /ap/* — session-based, backed by the admins and
 * admin_sessions tables in NeonDB.
 *
 * Server-only: import this from server components, server actions, and
 * route handlers only. Every admin page AND every admin server action must
 * call requireAdmin() — actions are reachable by direct POST, so a check in
 * the layout alone is not a security boundary.
 */
import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";

const SESSION_COOKIE = "fin_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type Admin = { id: number; username: string };

/* ---------- password hashing (format shared with scripts/db-setup.mjs) --- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expected, "hex");
  return (
    actual.length === expectedBuf.length && timingSafeEqual(actual, expectedBuf)
  );
}

/* ---------- sessions ----------------------------------------------------- */

/** Only the SHA-256 of the session token is stored server-side. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Verify credentials against the admins table. Returns null on failure. */
export async function authenticate(
  username: string,
  password: string,
): Promise<Admin | null> {
  const sql = db();
  const rows = (await sql`
    SELECT id, username, password_hash FROM admins WHERE username = ${username}
  `) as { id: number; username: string; password_hash: string }[];
  const admin = rows[0];
  if (!admin || !verifyPassword(password, admin.password_hash)) return null;
  return { id: admin.id, username: admin.username };
}

/** Create a DB session and set the cookie. Call from a server action only. */
export async function createSession(adminId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const sql = db();
  await sql`
    INSERT INTO admin_sessions (token_hash, admin_id, expires_at)
    VALUES (${hashToken(token)}, ${adminId}, ${expiresAt.toISOString()})
  `;
  // Opportunistic cleanup of expired sessions.
  await sql`DELETE FROM admin_sessions WHERE expires_at < now()`;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Delete the DB session and clear the cookie. Call from a server action. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db()`DELETE FROM admin_sessions WHERE token_hash = ${hashToken(token)}`;
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Resolve the logged-in admin from the session cookie (null if none).
 * Wrapped in React cache() so one request does at most one lookup.
 */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = (await db()`
    SELECT a.id, a.username
    FROM admin_sessions s
    JOIN admins a ON a.id = s.admin_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()
  `) as Admin[];
  return rows[0] ?? null;
});

/** Gate for admin pages and actions — redirects to the login page. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/ap/login");
  return admin;
}
