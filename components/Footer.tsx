import Link from "next/link";
import { FinLogo } from "./icons";

export function Footer() {
  return (
    <footer className="border-t border-border-soft">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <FinLogo className="h-6 w-6 text-accent" />
            <span className="font-semibold">fin</span>
            <span className="text-sm text-fg-faint">
              — run local dev containers, extensible via plugs.
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
            <Link href="/docs" className="hover:text-accent">
              Docs
            </Link>
            <Link href="/docs/commands" className="hover:text-accent">
              Commands
            </Link>
            <Link href="/docs/writing-a-plug" className="hover:text-accent">
              Write a plug
            </Link>
            <a
              href="https://github.com/"
              className="hover:text-accent"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
        <p className="mt-8 text-xs text-fg-faint">
          MIT licensed. Built with Typer, Rich, the Docker SDK for Python, and
          Traefik.
        </p>
      </div>
    </footer>
  );
}
