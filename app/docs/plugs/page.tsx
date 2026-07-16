import type { Metadata } from "next";
import { PageHeader, H2, P, Code, Callout, Pager, RefTable } from "@/components/Prose";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata: Metadata = {
  title: "Plugs",
  description: "Fin's plugin system — App, Asset, and Global plugs, and how they're discovered.",
};

export default function PlugsPage() {
  return (
    <>
      <PageHeader
        title="Plugs"
        lead="A plug is a Python package that extends Fin. Plugs describe containers and contribute commands — but they never touch Docker themselves."
      />

      <H2 id="types">The three plug types</H2>
      <RefTable
        head={["Type", "Role"]}
        rows={[
          [<Code>APP</Code>, "A runnable application (Laravel, Django, …). Provides the primary container spec and app-specific commands."],
          [<Code>ASSET</Code>, "A shared auxiliary service (MySQL, Redis, Postgres, …) reused across projects."],
          [<Code>GLOBAL</Code>, "Commands available everywhere, not tied to a project."],
        ]}
      />

      <H2 id="layout">Directory layout</H2>
      <P>Plugs live under the plugs directory, grouped by type:</P>
      <CodeBlock
        code={`<PLUGS_DIR>/
  App/<name>/__init__.py      # PlugType.APP
  Asset/<name>/__init__.py    # PlugType.ASSET
  Global/<name>/__init__.py   # PlugType.GLOBAL`}
      />
      <P>
        <Code>PLUGS_DIR</Code> is fixed at <Code>~/.fin/plugs</Code> (it moves with{" "}
        <Code>FIN_DATA_DIR</Code>). The loader imports each package by file path, finds
        the single class that subclasses <Code>FinPlug</Code> (<strong>only</strong>{" "}
        <Code>FinPlug</Code> subclasses count), instantiates it, and calls{" "}
        <Code>setup()</Code>. A bad plug logs a warning and is skipped — it never crashes Fin.
      </P>

      <Callout kind="tip" title="Plugs are declarative">
        A plug returns <Code>ContainerSpec</Code> / <Code>PlugCommand</Code> objects and asks{" "}
        <Code>PlugContext</Code> to exec inside a running container — it must never call
        Docker itself. Fin&apos;s orchestrator is the sole code path that touches the daemon.
      </Callout>

      <H2 id="bundled">Bundled plugs</H2>
      <RefTable
        head={["Plug", "Type", "Provides"]}
        rows={[
          [<Code>laravel</Code>, "APP", "PHP/Laravel container + artisan, composer, tinker, migrate, seed, make, queue, bash, phpunit, bin, php."],
          [<Code>mysql</Code>, "ASSET", <>Shared <Code>fin_mysql</Code> container.</>],
          [<Code>postgres</Code>, "ASSET", <>Shared <Code>fin_postgres</Code> container.</>],
          [<Code>redis</Code>, "ASSET", <>Shared <Code>fin_redis</Code> container.</>],
        ]}
      />

      <H2 id="managing">Managing plugs</H2>
      <CodeBlock
        lang="bash"
        prompt
        code={`fin plugs list                 # installed plugs and their commands
fin plugs info laravel         # one plug's metadata and path
fin plugs install <git-url>    # install a plug from a git URL
fin plugs uninstall <name>     # remove an installed plug`}
      />
      <P>
        A SQLite registry at <Code>~/.fin/registry.db</Code> caches plug metadata for fast
        lookups; it refreshes automatically whenever you list plugs.
      </P>

      <Pager
        prev={{ title: "How it works", href: "/docs/how-it-works" }}
        next={{ title: "Environment variables", href: "/docs/environment" }}
      />
    </>
  );
}
