import type { Metadata } from "next";
import { PageHeader, H2, P, Code, Callout, Pager } from "@/components/Prose";
import { CodeBlock } from "@/components/CodeBlock";
import { COMMAND_GROUPS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Commands",
  description: "The full Fin command reference — system, containers, images, plugs, and Laravel.",
};

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CommandsPage() {
  return (
    <>
      <PageHeader
        title="Command reference"
        lead="Every Fin command, grouped by area. A sub-command resolves in order: reserved (system) → FIN_APP plug → FIN_PLUGS plugs → GLOBAL plugs."
      />

      <Callout kind="info" title="Per-command help">
        Run <Code>fin &lt;command&gt; --help</Code> or <Code>fin help &lt;command&gt;</Code>{" "}
        for usage, subcommands, options, and examples — for reserved commands{" "}
        <em>and</em> plug commands.
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
                    {cmd.args && <span className="text-term-yellow"> {cmd.args}</span>}
                  </code>
                  {cmd.aliases && (
                    <div className="mt-0.5 font-mono text-xs text-fg-faint">
                      alias: {cmd.aliases}
                    </div>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-fg-muted">{cmd.desc}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

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
        prev={{ title: "Environment variables", href: "/docs/environment" }}
        next={{ title: "Writing a plug", href: "/docs/writing-a-plug" }}
      />
    </>
  );
}
