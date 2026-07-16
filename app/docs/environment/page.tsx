import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, H2, P, Code, Callout, Pager, RefTable } from "@/components/Prose";
import { PROJECT_ENV, SYSTEM_ENV } from "@/lib/content";

export const metadata: Metadata = {
  title: "Environment variables",
  description: "Every FIN_* variable Fin reads — project config and system config.",
};

export default function EnvironmentPage() {
  return (
    <>
      <PageHeader
        title="Environment variables"
        lead="Fin reads FIN_*-prefixed variables (plus the standard Laravel DB_* / REDIS_* vars) from the project's .env, or the process environment."
      />

      <Callout kind="info" title="Precedence">
        Process environment variables take precedence over the <Code>.env</Code> file, so{" "}
        <Code>FIN_SITE=other.localhost fin up</Code> works for a one-off override.
      </Callout>

      <H2 id="project">Project variables</H2>
      <P>Read from <Code>./.env</Code> in the directory you run <Code>fin</Code> from.</P>
      <RefTable
        head={["Variable", "Meaning", "Default"]}
        rows={PROJECT_ENV.map((v) => [
          <Code key={v.name}>{v.name}</Code>,
          v.meaning,
          v.default ? <Code>{v.default}</Code> : <span className="text-fg-faint">—</span>,
        ])}
      />

      <H2 id="system">System variables</H2>
      <P>
        Set in the process environment to tune Fin&apos;s own behavior. The one-time
        variables read by <Code>install.sh</Code> (<Code>FIN_VERSION</Code>,{" "}
        <Code>FIN_HOME_DIR</Code>, <Code>FIN_BIN_DIR</Code>, …) are documented in{" "}
        <Link href="/docs/installation#installer-overrides" className="text-accent hover:underline">
          Installation → Installer overrides
        </Link>.
      </P>
      <RefTable
        head={["Variable", "Meaning", "Default"]}
        rows={SYSTEM_ENV.map((v) => [
          <Code key={v.name}>{v.name}</Code>,
          v.meaning,
          v.default ? <Code>{v.default}</Code> : <span className="text-fg-faint">—</span>,
        ])}
      />

      <H2 id="validation">Per-command validation</H2>
      <P>
        Each plug declares an <Code>env_spec()</Code> — the variables it requires, their
        allowed <Code>choices</Code>, types, and defaults. Before doing any work,{" "}
        <Code>fin up</Code> validates the spec and reports <strong>all</strong> problems at
        once in a single panel, so you can fix everything in one pass.
      </P>

      <Pager
        prev={{ title: "Plugs", href: "/docs/plugs" }}
        next={{ title: "Commands", href: "/docs/commands" }}
      />
    </>
  );
}
