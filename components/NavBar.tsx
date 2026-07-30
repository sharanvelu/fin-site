"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FinLogo, Icon } from "./icons";

const LINKS = [
  { title: "Docs", href: "/docs" },
  { title: "Commands", href: "/docs/commands" },
  { title: "Plugs", href: "/docs/plugs" },
];

export function NavBar({ version = "v0.1.6" }: { version?: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <FinLogo className="h-7 w-7 text-accent" />
          <span className="text-lg font-semibold tracking-tight">fin</span>
          <span className="hidden rounded-full border border-border bg-panel px-2 py-0.5 font-mono text-[10px] text-fg-faint sm:inline">
            {version}
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active =
              pathname === l.href ||
              (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-panel text-fg"
                    : "text-fg-muted hover:bg-panel/60 hover:text-fg"
                }`}
              >
                {l.title}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/docs/installation"
            className="hidden rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-bg transition hover:bg-accent-strong sm:inline-block"
          >
            Install
          </Link>
          <a
            href="https://github.com/sharanvelu/fin"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub"
            className="rounded-lg border border-border p-2 text-fg-muted transition hover:border-accent hover:text-accent"
          >
            <Icon.github className="h-5 w-5" />
          </a>
        </div>
      </div>
    </header>
  );
}
