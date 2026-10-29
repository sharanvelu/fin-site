import type { Metadata } from "next";
import { removeUser, setUserRole, toggleUserDisabled } from "@/app/ap/actions";
import { RoleBadge } from "@/components/RoleBadge";
import { requireAdmin } from "@/lib/auth";
import { formatTimestamp } from "@/lib/feedback";
import { ROLES, ROLE_META } from "@/lib/roles";
import { listUsers } from "@/lib/users-store";

export const metadata: Metadata = { title: "Users" };

const BUTTON =
  "rounded-lg border border-border px-2.5 py-1 text-xs text-fg-muted transition hover:border-accent hover:text-accent";

export default async function AdminUsersPage() {
  const actor = await requireAdmin();
  const users = await listUsers();

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-fg">Users</h1>
        <p className="font-mono text-sm text-fg-faint">
          {users.length} {users.length === 1 ? "user" : "users"}
        </p>
      </div>
      <p className="mt-2 text-sm text-fg-muted">
        People who have signed in through the identity provider. Members have no
        access until you assign a role.
      </p>

      <div className="mt-8 overflow-x-auto rounded-card border border-border">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-panel/60">
              <th className="px-4 py-2.5 font-semibold text-fg">Name</th>
              <th className="px-4 py-2.5 font-semibold text-fg">Email</th>
              <th className="px-4 py-2.5 font-semibold text-fg">Role</th>
              <th className="px-4 py-2.5 font-semibold text-fg">Status</th>
              <th className="px-4 py-2.5 font-semibold text-fg">Last login</th>
              <th className="px-4 py-2.5 font-semibold text-fg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === actor.id;
              return (
                <tr
                  key={user.id}
                  className="border-b border-border-soft align-top last:border-0 hover:bg-panel/30"
                >
                  <td className="px-4 py-2.5 text-fg">
                    {user.name ?? "—"}
                    {isSelf && (
                      <span className="ml-2 text-xs text-fg-faint">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-fg-muted">
                    {user.email ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-2.5 text-fg-muted">
                    {user.disabled ? (
                      <span className="text-term-red">Disabled</span>
                    ) : (
                      "Active"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-fg-faint">
                    {user.last_login_at
                      ? formatTimestamp(user.last_login_at)
                      : "never"}
                  </td>
                  <td className="px-4 py-2.5">
                    {isSelf ? (
                      <span className="text-xs text-fg-faint">—</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <form action={setUserRole} className="flex gap-1.5">
                          <input type="hidden" name="id" value={user.id} />
                          <select
                            name="role"
                            defaultValue={user.role}
                            aria-label={`Role for ${user.email ?? user.name ?? user.id}`}
                            className="rounded-lg border border-border bg-bg-soft px-2 py-1 text-xs text-fg focus:border-accent focus:outline-none"
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_META[role].label}
                              </option>
                            ))}
                          </select>
                          <button type="submit" className={BUTTON}>
                            Save
                          </button>
                        </form>
                        <form action={toggleUserDisabled}>
                          <input type="hidden" name="id" value={user.id} />
                          <input
                            type="hidden"
                            name="disabled"
                            value={user.disabled ? "false" : "true"}
                          />
                          <button type="submit" className={BUTTON}>
                            {user.disabled ? "Enable" : "Disable"}
                          </button>
                        </form>
                        <form action={removeUser}>
                          <input type="hidden" name="id" value={user.id} />
                          <button
                            type="submit"
                            className={`${BUTTON} hover:border-term-red hover:text-term-red`}
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
