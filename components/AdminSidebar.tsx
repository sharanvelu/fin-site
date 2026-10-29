"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/ap/actions";
import { REQUEST_TYPE_DEFS } from "@/lib/feedback";
import { Icon } from "@/components/icons";
import { ROLE_META, canManageUsers, canTriage, type Role } from "@/lib/roles";

type Group = { title: string; items: { title: string; href: string }[] };

function groupsFor(role: Role): Group[] {
  const groups: Group[] = [
    { title: "Overview", items: [{ title: "Dashboard", href: "/ap" }] },
  ];
  if (canTriage(role)) {
    groups.push({
      title: "Feedback",
      items: REQUEST_TYPE_DEFS.map((def) => ({
        title: def.label,
        href: `/ap/${def.slug}`,
      })),
    });
  }
  if (canManageUsers(role)) {
    groups.push({
      title: "Admin",
      items: [{ title: "Users", href: "/ap/users" }],
    });
  }
  return groups;
}

export function AdminSidebar({
  user,
}: {
  user: { label: string; role: Role };
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-7">
      {groupsFor(user.role).map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-fg-faint">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/ap"
                  ? pathname === "/ap"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-1.5 text-sm transition ${
                      active
                        ? "bg-accent-soft font-medium text-accent"
                        : "text-fg-muted hover:bg-panel hover:text-fg"
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="border-t border-border-soft pt-4">
        <p className="mb-2 px-3 text-xs text-fg-faint">
          Signed in as{" "}
          <span className="font-mono text-fg-muted">{user.label}</span>
          <span className="ml-1.5">({ROLE_META[user.role].label})</span>
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-fg-muted transition hover:bg-panel hover:text-term-red"
          >
            <Icon.logout className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
