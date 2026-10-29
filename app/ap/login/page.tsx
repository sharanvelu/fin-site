import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginButton } from "@/components/LoginButton";
import { FinLogo } from "@/components/icons";
import { getUser } from "@/lib/auth";
import {
  isLoginErrorCode,
  loginErrorMessage,
  providerNameFromEnv,
} from "@/lib/oidc-config";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getUser()) redirect("/ap");
  const { error } = await searchParams;

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
        <div className="space-y-4">
          {isLoginErrorCode(error) && (
            <p className="rounded-lg border border-term-red/30 bg-term-red/5 px-3 py-2 text-xs text-term-red">
              {loginErrorMessage(error)}
            </p>
          )}
          <LoginButton providerName={providerNameFromEnv(process.env)} />
        </div>
      </div>
    </div>
  );
}
