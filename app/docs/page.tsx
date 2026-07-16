import type { Metadata } from "next";
import { PageHeader, H2, P, Code, Callout, Pager, RefTable } from "@/components/Prose";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata: Metadata = {
  title: "Introduction",
  description:
    "Fin is a fast, opinionated, plugin-driven CLI for running local-development Docker containers.",
};

export default function DocsHome() {
  return (
    <>
      <PageHeader
        title="Introduction"
        lead="Fin is a fast, opinionated, plugin-driven CLI for running local-development Docker containers. Point it at a project, declare a few FIN_* variables in your .env, and fin up brings up everything that project needs."
      />

      <P>
        A routing proxy, shared databases and caches, and your application container — all
        on one Docker network, all reachable by friendly <Code>*.localhost</Code> hostnames.
        Fin trades hand-rolled <Code>docker compose</Code> files for a declarative plugin
        system and a single, audited path to the Docker daemon.
      </P>

      <H2 id="why">Why Fin</H2>
      <P>
        Local development usually means juggling ports, copy-pasting compose files between
        projects, and re-creating the same database container over and over. Fin replaces
        that with opinionated defaults:
      </P>
      <RefTable
        head={["Instead of", "Fin gives you"]}
        rows={[
          ["Per-project compose files", <>Declarative <Code>FIN_*</Code> variables in <Code>.env</Code></>],
          ["localhost:8080, :8081, :8082…", <>Hostname routing via a built-in Traefik proxy</>],
          ["A DB container per project", <>One shared <Code>fin_mysql</Code> / <Code>fin_postgres</Code> / <Code>fin_redis</Code></>],
          ["Raw Docker tracebacks", <>Clean error panels with meaningful exit codes</>],
        ]}
      />

      <H2 id="mental-model">The mental model</H2>
      <P>
        Three ideas carry most of Fin:
      </P>
      <RefTable
        head={["Concept", "What it is"]}
        rows={[
          [<><strong>Plug</strong></>, "A declarative class describing containers and contributing commands. Apps (Laravel), assets (MySQL), and global tools are all plugs."],
          [<><strong>Asset</strong></>, "A shared, fixed-name service container reused across every project."],
          [<><strong>Proxy</strong></>, "An always-on Traefik container that routes web-exposed containers by hostname."],
        ]}
      />

      <H2 id="taste">A taste</H2>
      <P>From inside a project, declare what it needs and bring it up:</P>
      <CodeBlock
        filename=".env"
        lang="dotenv"
        code={`FIN_APP=laravel
FIN_SITE=myapp.localhost
FIN_PLUGS=mysql,redis`}
      />
      <CodeBlock lang="bash" prompt code={`fin up`} />
      <P>
        Fin ensures the proxy, starts the shared <Code>fin_mysql</Code> and{" "}
        <Code>fin_redis</Code> containers, starts your app container, creates the project
        database if it&apos;s missing, and prints the URL it&apos;s served at.
      </P>

      <Callout kind="tip" title="No Python required">
        Fin ships as a prebuilt, standalone binary that embeds its own Python interpreter —
        no Python, pip, or virtualenv on your machine. You only need Docker running
        (Python 3.11+ is needed only if you install from source).
      </Callout>

      <Pager
        next={{ title: "Installation", href: "/docs/installation" }}
      />
    </>
  );
}
