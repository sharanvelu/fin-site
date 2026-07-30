import type { Metadata } from "next";
import {
  PageHeader,
  H2,
  P,
  Code,
  Callout,
  Pager,
  RefTable,
} from "@/components/Prose";
import { CodeBlock } from "@/components/CodeBlock";
import { PlugCatalog } from "@/components/PlugCatalog";

export const metadata: Metadata = {
  title: "Plugs",
  description:
    "Fin's plugin system — App, Asset, and Global plugs, and how they're discovered.",
};

export default function PlugsPage() {
  return (
    <>
      <PageHeader
        title="Plugs"
        lead="A plug is a single Python file that extends Fin. Plugs describe containers and contribute commands — but they never touch Docker themselves."
      />

      <H2 id="types">The three plug types</H2>
      <RefTable
        head={["Type", "Role"]}
        rows={[
          [
            <Code key="app">APP</Code>,
            "A runnable application (Laravel, Django, …). Provides the primary container spec and app-specific commands.",
          ],
          [
            <Code key="asset">ASSET</Code>,
            "A shared auxiliary service (MySQL, Redis, Postgres, …) reused across projects.",
          ],
          [
            <Code key="global">GLOBAL</Code>,
            "Commands available everywhere, not tied to a project.",
          ],
        ]}
      />

      <H2 id="layout">Directory layout</H2>
      <P>
        Plugs live as flat <Code>.py</Code> files directly under the plugs
        directory — the plug&apos;s type comes from the class&apos;s{" "}
        <Code>plug_type</Code> attribute, not from where the file sits:
      </P>
      <CodeBlock
        code={`<PLUGS_DIR>/
  <name>.py                   # one FinPlug subclass; filename == plug name`}
      />
      <P>
        <Code>PLUGS_DIR</Code> is fixed at <Code>~/.fin/plugs</Code> (it moves
        with <Code>FIN_DATA_DIR</Code>). The loader imports each file by path,
        finds the single class that subclasses <Code>FinPlug</Code> (
        <strong>only</strong> <Code>FinPlug</Code> subclasses count),
        instantiates it, and calls <Code>setup()</Code>. A bad plug logs a
        warning and is skipped — it never crashes Fin.
      </P>

      <Callout kind="tip" title="Plugs are declarative">
        A plug returns <Code>ContainerSpec</Code> / <Code>PlugCommand</Code>{" "}
        objects and asks <Code>PlugContext</Code> to exec inside a running
        container — it must never call Docker itself. Fin&apos;s orchestrator is
        the sole code path that touches the daemon.
      </Callout>

      <H2 id="bundled">Catalog plugs</H2>
      <P>
        Plugs are <strong>not</strong> embedded in the <Code>fin</Code> binary —
        they stay as plain <Code>.py</Code> files loaded at runtime, installed
        into <Code>~/.fin/plugs</Code> from the official plug catalog (the{" "}
        <Code>fin-plugs</Code> repo).{" "}
        <Code>fin plugs install &lt;name&gt;</Code> fetches{" "}
        <Code>plugs/&lt;name&gt;.py</Code> over plain HTTPS;{" "}
        <Code>fin plugs search</Code> reads the catalog index. Each plug below
        has its own page with commands, env vars, and connection details:
      </P>
      <PlugCatalog />

      <H2 id="managing">Managing plugs</H2>
      <CodeBlock
        lang="bash"
        prompt
        code={`fin plugs list                 # installed plugs and their commands
fin plugs info laravel         # one plug's metadata and path
fin plugs search <query>       # search the remote plug catalog
fin plugs install <name>       # install by catalog name (or a git URL)
fin plugs uninstall <name>     # remove an installed plug`}
      />
      <P>
        A SQLite registry at <Code>~/.fin/registry.db</Code> caches plug
        metadata for fast lookups; it refreshes automatically whenever you list
        plugs.
      </P>

      <Callout kind="tip" title="fin up installs missing plugs for you">
        Before starting anything, <Code>fin up</Code> checks that the{" "}
        <Code>FIN_APP</Code> plug and every plug in <Code>FIN_PLUGS</Code> is
        installed. If any are missing it offers to install them from the catalog
        (defaults to Yes) and then continues — decline and it aborts, listing
        the exact <Code>fin plugs install &lt;name&gt;</Code> commands to run
        yourself.
      </Callout>

      <Pager
        prev={{ title: "How it works", href: "/docs/how-it-works" }}
        next={{ title: "Environment variables", href: "/docs/environment" }}
      />
    </>
  );
}
