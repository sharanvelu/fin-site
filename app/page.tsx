import Link from "next/link";
import { Terminal } from "@/components/Terminal";
import { CodeBlock } from "@/components/CodeBlock";
import { FinLogo, Icon } from "@/components/icons";
import { HIGHLIGHTS, INSTALL_ONE_LINER } from "@/lib/content";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] glow" aria-hidden />

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="min-w-0 animate-fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-panel/60 px-3 py-1 text-xs text-fg-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Plugin-driven local dev containers
            </div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Spin up your stack with{" "}
              <span className="text-accent">one command</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
              Fin is a fast, opinionated CLI for running local-development Docker
              containers. Declare a few <code className="font-mono text-accent">FIN_*</code>{" "}
              variables in your <code className="font-mono text-accent">.env</code>, run{" "}
              <code className="font-mono text-accent">fin up</code>, and get a routing proxy,
              shared databases, and your app — all on friendly{" "}
              <code className="font-mono text-accent">*.localhost</code> hostnames.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-medium text-bg transition hover:bg-accent-strong"
              >
                Get started
                <Icon.arrow className="h-4 w-4" />
              </Link>
              <Link
                href="/docs/commands"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 font-medium text-fg transition hover:border-accent hover:text-accent"
              >
                <Icon.terminal className="h-4 w-4" />
                Command reference
              </Link>
            </div>
          </div>

          <div className="min-w-0 animate-fade-up [animation-delay:120ms]">
            <Terminal />
          </div>
        </div>

        {/* Install one-liner */}
        <div className="mx-auto mt-16 max-w-3xl">
          <p className="mb-2 text-center text-sm text-fg-faint">
            Install in one line — a prebuilt, standalone binary. No Python required, just Docker.
          </p>
          <CodeBlock code={INSTALL_ONE_LINER} lang="bash" />
        </div>
      </section>

      {/* Highlights */}
      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map((h) => {
            const IconCmp = Icon[h.icon];
            return (
              <div
                key={h.title}
                className="rounded-card border border-border bg-panel/40 p-5 transition hover:border-accent/50 hover:bg-panel/70"
              >
                <div className="mb-3 inline-flex rounded-lg border border-border bg-bg-soft p-2 text-accent">
                  {IconCmp ? <IconCmp className="h-5 w-5" /> : null}
                </div>
                <h3 className="mb-1.5 font-semibold text-fg">{h.title}</h3>
                <p className="text-sm leading-relaxed text-fg-muted">{h.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workflow */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight">From clone to running in seconds</h2>
          <p className="mx-auto mt-3 max-w-2xl text-fg-muted">
            Point Fin at a project, declare what it needs, and let it orchestrate the
            proxy, assets, and your app container.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-fg-faint">
              <span className="rounded bg-panel px-2 py-0.5 font-mono text-xs text-accent">1</span>
              Declare your stack in <span className="font-mono">.env</span>
            </div>
            <CodeBlock
              filename=".env"
              lang="dotenv"
              code={`FIN_APP=laravel
FIN_SITE=myapp.localhost
FIN_PHP_VERSION=8.3
FIN_PLUGS=mysql,redis

DB_CONNECTION=mysql
DB_HOST=fin_mysql
DB_DATABASE=myapp`}
            />
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-fg-faint">
              <span className="rounded bg-panel px-2 py-0.5 font-mono text-xs text-accent">2</span>
              Bring it up, then use your tools
            </div>
            <CodeBlock
              lang="bash"
              prompt
              code={`fin up
fin artisan migrate
fin composer require some/package
fin tinker
fin ps`}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6">
        <div className="overflow-hidden rounded-card border border-border bg-gradient-to-br from-panel to-bg-soft p-10 text-center">
          <FinLogo className="mx-auto mb-4 h-10 w-10 text-accent" />
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Extensible by design
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-fg-muted">
            Every app type and service is a <em>plug</em> — a small declarative class that
            describes containers and contributes commands. Bundled plugs cover Laravel,
            MySQL, PostgreSQL and Redis. Write your own in a few lines of Python.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/docs/writing-a-plug"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-medium text-bg transition hover:bg-accent-strong"
            >
              Write a plug
              <Icon.arrow className="h-4 w-4" />
            </Link>
            <Link
              href="/docs/how-it-works"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 font-medium text-fg transition hover:border-accent hover:text-accent"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
