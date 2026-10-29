import { ROLE_META, type Role } from "@/lib/roles";

export function RoleBadge({ role }: { role: Role }) {
  const meta = ROLE_META[role];
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.badge}`}
    >
      {meta.label}
    </span>
  );
}
