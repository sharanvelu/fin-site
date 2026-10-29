/**
 * Starts the OIDC flow. A plain anchor (not next/link) so the browser does a
 * full navigation into the /ap/auth/login route handler.
 */
export function LoginButton({ providerName }: { providerName: string }) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler, not a page
    <a
      href="/ap/auth/login"
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition hover:bg-accent-strong"
    >
      Login with {providerName}
    </a>
  );
}
