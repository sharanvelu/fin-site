/**
 * Admin auth for /ap/* — OIDC login, then a session backed by the users and
 * admin_sessions tables in NeonDB. See lib/oidc.ts for the login flow.
 *
 * Server-only: import this from server components, server actions, and
 * route handlers only. Every admin page AND every admin server action must
 * call requireUser() / requireEditor() / requireAdmin() — actions are
 * reachable by direct POST, so a check in the layout alone is not a security
 * boundary. The same goes for the IP allowlist: proxy.ts enforces it for
 * requests under /ap, and the gates below re-check it for actions.
 */
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import {
  clientIpFromHeaders,
  isIpAllowed,
  parseAllowlist,
} from "./ip-allowlist";
import { DEFAULT_ROLE, canManageUsers, canTriage, type Role } from "./roles";
import {
  findUserByIdentity,
  insertUser,
  touchUserLogin,
  type Identity,
  type UserRow,
} from "./users-store";

export const SESSION_COOKIE = "fin_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SessionUser = {
  id: number;
  email: string | null;
  name: string | null;
  role: Role;
};

/* ---------- IP allowlist ------------------------------------------------- */

/**
 * Re-checks ADMIN_IP_ALLOWLIST for the current request (defense in depth —
 * a server action can be POSTed to any route, bypassing proxy.ts's matcher).
 * An invalid allowlist throws, so this fails closed.
 */
export async function assertAllowedIp(): Promise<void> {
  const rules = parseAllowlist(process.env.ADMIN_IP_ALLOWLIST);
  if (rules.length === 0) return;
  const ip = clientIpFromHeaders(await headers());
  if (!ip || !isIpAllowed(ip, rules)) {
    throw new Error("Request origin not allowed.");
  }
}

/* ---------- sessions ----------------------------------------------------- */

/** Only the SHA-256 of the session token is stored server-side. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Create a DB session and set the cookie. Server action / route handler only. */
export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const sql = db();
  await sql`
    INSERT INTO admin_sessions (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${userId}, ${expiresAt.toISOString()})
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
 * Resolve the signed-in user from the session cookie (null if none, expired,
 * or disabled). Wrapped in React cache() so one request does at most one lookup.
 */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = (await db()`
    SELECT u.id, u.email, u.name, u.role
    FROM admin_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)}
      AND s.expires_at > now()
      AND NOT u.disabled
  `) as SessionUser[];
  return rows[0] ?? null;
});

/* ---------- gates -------------------------------------------------------- */

/** Any signed-in user (including members) — redirects to the login page. */
export async function requireUser(): Promise<SessionUser> {
  await assertAllowedIp();
  const user = await getUser();
  if (!user) redirect("/ap/login");
  return user;
}

/** Admins and editors — members are sent to the awaiting-approval page. */
export async function requireEditor(): Promise<SessionUser> {
  const user = await requireUser();
  if (!canTriage(user.role)) redirect("/ap");
  return user;
}

/** Admins only. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!canManageUsers(user.role)) redirect("/ap");
  return user;
}

/* ---------- login resolution --------------------------------------------- */

/**
 * Map a verified OIDC identity to a user row. Known users get their login
 * recorded; unknown users are created as members when JIT provisioning is on
 * and rejected (null) otherwise. The caller must check `disabled`.
 */
export async function resolveUser(
  identity: Identity,
  jit: boolean,
): Promise<UserRow | null> {
  const existing = await findUserByIdentity(identity.issuer, identity.subject);
  if (existing) {
    await touchUserLogin(existing.id, identity);
    return {
      ...existing,
      email: identity.email ?? existing.email,
      name: identity.name ?? existing.name,
    };
  }
  if (!jit) return null;
  return insertUser(identity, DEFAULT_ROLE);
}
