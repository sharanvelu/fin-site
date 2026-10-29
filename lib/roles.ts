/**
 * Admin-panel role model — pure, shared by auth gates, the sidebar, and the
 * user-management UI. Roles are stored in the `users.role` column.
 */
export const ROLES = ["admin", "editor", "member"] as const;

export type Role = (typeof ROLES)[number];

/** Role given to users created by just-in-time provisioning. */
export const DEFAULT_ROLE: Role = "member";

export const ROLE_META: Record<Role, { label: string; badge: string }> = {
  admin: {
    label: "Admin",
    badge: "border-accent/40 bg-accent-soft text-accent",
  },
  editor: {
    label: "Editor",
    badge: "border-term-green/40 bg-term-green/5 text-term-green",
  },
  member: {
    label: "Member",
    badge: "border-border bg-panel text-fg-muted",
  },
};

export function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" && (ROLES as readonly string[]).includes(value)
  );
}

/** Admins manage users. */
export function canManageUsers(role: Role): boolean {
  return role === "admin";
}

/** Admins and editors can view and triage feedback. */
export function canTriage(role: Role): boolean {
  return role === "admin" || role === "editor";
}

/** An admin may change, disable, or delete anyone except themselves. */
export function canChangeUser(actorId: number, targetId: number): boolean {
  return actorId !== targetId;
}

export function displayName(user: {
  id: number;
  name: string | null;
  email: string | null;
}): string {
  return user.name || user.email || `user #${user.id}`;
}
