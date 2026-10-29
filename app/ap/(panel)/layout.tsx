import type { Metadata } from "next";
import { AdminSidebar } from "@/components/AdminSidebar";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin panel",
  robots: { index: false, follow: false },
};

/**
 * Shell for all admin pages. requireAdmin() here handles the common case,
 * but every page and action re-verifies the session itself — a layout is
 * not a security boundary (it doesn't re-render on client-side navigation).
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row">
      <aside className="shrink-0 lg:w-56">
        <div className="lg:sticky lg:top-24">
          <AdminSidebar username={admin.username} />
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
