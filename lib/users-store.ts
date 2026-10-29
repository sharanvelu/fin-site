/**
 * DB access for admin-panel users (server-only). All queries are parameterized
 * via the Neon tagged-template client from lib/db.ts.
 */
import { db } from "./db";
import type { Role } from "./roles";

export type UserRow = {
  id: number;
  issuer: string;
  subject: string;
  email: string | null;
  name: string | null;
  role: Role;
  disabled: boolean;
  created_at: Date;
  last_login_at: Date | null;
};

export type Identity = {
  issuer: string;
  subject: string;
  email: string | null;
  name: string | null;
};

export async function findUserByIdentity(
  issuer: string,
  subject: string,
): Promise<UserRow | null> {
  const rows = (await db()`
    SELECT * FROM users WHERE issuer = ${issuer} AND subject = ${subject}
  `) as UserRow[];
  return rows[0] ?? null;
}

export async function insertUser(
  identity: Identity,
  role: Role,
): Promise<UserRow> {
  const rows = (await db()`
    INSERT INTO users (issuer, subject, email, name, role, last_login_at)
    VALUES (
      ${identity.issuer},
      ${identity.subject},
      ${identity.email},
      ${identity.name},
      ${role},
      now()
    )
    RETURNING *
  `) as UserRow[];
  return rows[0];
}

/** Records a login and refreshes email/name from the latest ID token. */
export async function touchUserLogin(
  id: number,
  identity: Pick<Identity, "email" | "name">,
): Promise<void> {
  await db()`
    UPDATE users
    SET email = COALESCE(${identity.email}, email),
        name = COALESCE(${identity.name}, name),
        last_login_at = now()
    WHERE id = ${id}
  `;
}

export async function listUsers(): Promise<UserRow[]> {
  return (await db()`
    SELECT * FROM users ORDER BY created_at ASC, id ASC
  `) as UserRow[];
}

export async function updateUserRole(id: number, role: Role): Promise<void> {
  await db()`UPDATE users SET role = ${role} WHERE id = ${id}`;
}

/** Disabling also revokes the user's sessions so access ends immediately. */
export async function setUserDisabled(
  id: number,
  disabled: boolean,
): Promise<void> {
  const sql = db();
  await sql`UPDATE users SET disabled = ${disabled} WHERE id = ${id}`;
  if (disabled) {
    await sql`DELETE FROM admin_sessions WHERE user_id = ${id}`;
  }
}

/** Sessions are removed by ON DELETE CASCADE. */
export async function deleteUser(id: number): Promise<void> {
  await db()`DELETE FROM users WHERE id = ${id}`;
}
