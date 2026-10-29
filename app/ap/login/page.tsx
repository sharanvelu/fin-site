import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { FinLogo } from "@/components/icons";
import { getAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/ap");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col justify-center px-4 py-24 sm:px-6">
      <div className="rounded-card border border-border bg-panel p-6">
        <div className="mb-6 flex items-center gap-2.5">
          <FinLogo className="h-6 w-6 text-accent" />
          <div>
            <h1 className="text-base font-semibold text-fg">Admin panel</h1>
            <p className="text-xs text-fg-faint">Sign in to manage feedback</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
