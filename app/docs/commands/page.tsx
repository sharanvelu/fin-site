import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHeader,
  H2,
  P,
  Code,
  Callout,
  RefTable,
  Pager,
} from "@/components/Prose";
import { CodeBlock } from "@/components/CodeBlock";
import { COMMAND_GROUPS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Commands",
  description:
    "The full Fin command reference — system, containers, images, plugs, and Laravel.",
};

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CommandsPage() {
  return (
    <>
      <PageHeader
        title="Command reference"
        lead="Fin's commands, grouped by area — plug-specific commands (like Django's) live on each plug's page. A sub-command resolves in order: reserved (system) → FIN_APP plug → FIN_PLUGS plugs → GLOBAL plugs."
      />

      <Callout kind="info" title="Per-command help">
        Run <Code>fin &lt;command&gt; --help</Code> or{" "}
        <Code>fin help &lt;command&gt;</Code> for usage, subcommands, options,
        and examples — for reserved commands <em>and</em> plug commands.
      </Callout>

      {COMMAND_GROUPS.map((group) => (
        <section key={group.group}>
          <H2 id={slug(group.group)}>{group.group}</H2>
          <P>{group.blurb}</P>
          <div className="my-5 overflow-hidden rounded-card border border-border">
            {group.commands.map((cmd, i) => (
              <div
                key={cmd.name}
                className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4 ${
                  i !== 0 ? "border-t border-border-soft" : ""
                } hover:bg-panel/30`}
              >
                <div className="shrink-0 sm:w-64">
                  <code className="font-mono text-sm">
                    <span className="text-accent">fin {cmd.name}</span>
                    {cmd.args && (
                      <span className="text-term-yellow"> {cmd.args}</span>
                    )}
                  </code>
                  {cmd.aliases && (
                    <div className="mt-0.5 font-mono text-xs text-fg-faint">
                      alias: {cmd.aliases}
                    </div>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-fg-muted">
                  {cmd.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <H2 id="stop-vs-down">Stopping and removing</H2>
      <P>
        The same scopes apply to <Code>stop</Code>, <Code>down</Code>, and{" "}
        <Code>asset</Code>: no scope is this project&apos;s containers,{" "}
        <Code>asset</Code> is the shared assets, and <Code>all</Code> is every
        Fin-managed container.
      </P>
      <RefTable
        head={["Command", "Behavior"]}
        rows={[
          [
            <Code key="stop">fin stop [asset|all]</Code>,
            <>
              Gracefully stops running containers and leaves them in place.{" "}
              <Code>-f</Code> is ignored.
            </>,
          ],
          [
            <Code key="down">fin down [asset|all]</Code>,
            "Gracefully stops running containers (waits up to ~10s for the process to exit), then removes every matching container.",
          ],
          [
            <Code key="down-f">fin down [asset|all] -f</Code>,
            "Force-removes immediately (kill), with no graceful shutdown.",
          ],
        ]}
      />
      <P>
        <Code>fin asset down [-f]</Code> follows the same rules for the shared
        asset containers.
      </P>
      <Callout kind="warn" title="down is graceful by default">
        Plain <Code>fin down</Code> now waits for running containers to shut
        down before removing them, so it can take longer than it used to. Add{" "}
        <Code>-f/--force</Code> for the fast behavior: it skips the graceful
        stop and force-removes immediately.
      </Callout>
      <P>
        Containers are stopped or removed in parallel (up to 8 at a time) with a
        live checklist titled <Code>Stopping containers</Code> or{" "}
        <Code>Removing containers</Code>. A failure on one container never
        aborts the others — see{" "}
        <Link href="/docs/quickstart#teardown">Tear down</Link> for sample
        output. The exit code is still <Code>0</Code> even when some containers
        fail.
      </P>

      <H2 id="help-version">Help &amp; version</H2>
      <CodeBlock
        lang="bash"
        prompt
        code={`fin --help            # command overview
fin config --help     # subcommands: enable | disable | get | list
fin artisan --help    # plug command help, incl. the plug's env spec
fin --version`}
      />

      <Pager
        prev={{ title: "MinIO plug", href: "/docs/plugs/minio" }}
        next={{ title: "Writing a plug", href: "/docs/writing-a-plug" }}
      />
    </>
  );
}
