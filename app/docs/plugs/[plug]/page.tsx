import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { PLUGS, getPlug } from "@/lib/plugs";

export const dynamicParams = false;

export function generateStaticParams() {
  return PLUGS.map((p) => ({ plug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plug: string }>;
}): Promise<Metadata> {
  const { plug } = await params;
  const info = getPlug(plug);
  if (!info) return {};
  return {
    title: `${info.title} plug`,
    description: info.summary,
  };
}

/** Prev/next through the catalog, bracketed by the surrounding NAV pages. */
function pagerFor(slug: string) {
  const i = PLUGS.findIndex((p) => p.slug === slug);
  const prev =
    i > 0
      ? {
          title: `${PLUGS[i - 1].title} plug`,
          href: `/docs/plugs/${PLUGS[i - 1].slug}`,
        }
      : { title: "Environment variables", href: "/docs/environment" };
  const next =
    i < PLUGS.length - 1
      ? {
          title: `${PLUGS[i + 1].title} plug`,
          href: `/docs/plugs/${PLUGS[i + 1].slug}`,
        }
      : { title: "Commands", href: "/docs/commands" };
  return { prev, next };
}

export default async function PlugPage({
  params,
}: {
  params: Promise<{ plug: string }>;
}) {
  const { plug } = await params;
  const info = getPlug(plug);
  if (!info) notFound();

  const { prev, next } = pagerFor(info.slug);

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`rounded border px-1.5 py-0.5 font-mono text-xs ${
            info.type === "APP"
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-term-green/30 bg-term-green/10 text-term-green"
          }`}
        >
          {info.type}
        </span>
        <span className="font-mono text-xs text-fg-faint">v{info.version}</span>
      </div>
      <PageHeader title={`${info.title} plug`} lead={info.summary} />

      <H2 id="install">Install</H2>
      <CodeBlock lang="bash" prompt code={`fin plugs install ${info.slug}`} />
      <P>
        Or skip the manual step — <Code>fin up</Code> offers to install any plug
        your <Code>.env</Code> references (<Code>FIN_APP</Code> /{" "}
        <Code>FIN_PLUGS</Code>) that isn&apos;t installed yet.
      </P>

      <H2 id="overview">Overview</H2>
      {info.overview.map((para) => (
        <P key={para.slice(0, 40)}>{para}</P>
      ))}

      {info.envExample && (
        <>
          <H2 id="usage">Usage</H2>
          <P>
            {info.type === "APP" ? (
              <>
                Set <Code>FIN_APP={info.slug}</Code> in the project&apos;s{" "}
                <Code>.env</Code> and run <Code>fin up</Code>:
              </>
            ) : (
              <>
                List <Code>{info.slug}</Code> in <Code>FIN_PLUGS</Code> (or
                enable it globally with{" "}
                <Code>fin config enable {info.slug}</Code>) and run{" "}
                <Code>fin up</Code>:
              </>
            )}
          </P>
          <CodeBlock filename=".env" lang="dotenv" code={info.envExample} />
        </>
      )}

      {info.env.length > 0 && (
        <>
          <H2 id="env">Environment variables</H2>
          <P>
            Declared via the plug&apos;s <Code>env_spec()</Code> —{" "}
            <Code>fin up</Code> validates them and reports every problem at
            once.
          </P>
          <RefTable
            head={["Variable", "Required", "Default", "Meaning"]}
            rows={info.env.map((v) => [
              <Code key={v.name}>{v.name}</Code>,
              v.required ? "yes" : "no",
              v.choices ? (
                <>
                  <Code>{v.default}</Code>{" "}
                  <span className="text-fg-faint">({v.choices})</span>
                </>
              ) : v.default ? (
                <Code>{v.default}</Code>
              ) : (
                <span className="text-fg-faint">—</span>
              ),
              v.desc,
            ])}
          />
        </>
      )}

      {info.commands.length > 0 && (
        <>
          <H2 id="commands">Commands</H2>
          <P>
            Available when <Code>FIN_APP={info.slug}</Code> (or{" "}
            <Code>{info.slug}</Code> is in <Code>FIN_PLUGS</Code>). Run any of
            them with <Code>--help</Code> for details.
          </P>
          <div className="my-5 overflow-hidden rounded-card border border-border">
            {info.commands.map((cmd, i) => (
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
        </>
      )}

      <H2 id="containers">Container</H2>
      <RefTable
        head={["Property", "Value"]}
        rows={info.containers.flatMap((c) => [
          ["Name", <Code key={`${c.name}-name`}>{c.name}</Code>],
          ["Image", <Code key={`${c.name}-image`}>{c.image}</Code>],
          ["Ports", c.ports],
          [
            "Volumes",
            <div key={`${c.name}-vol`} className="space-y-1">
              {c.volumes.map((v) => (
                <div key={v} className="font-mono text-xs">
                  {v}
                </div>
              ))}
            </div>,
          ],
        ])}
      />

      {info.connection && (
        <>
          <H2 id="connect">Connecting</H2>
          <RefTable
            head={["Property", "Value"]}
            rows={info.connection.map(([k, v]) => [
              k,
              <Code key={k}>{v}</Code>,
            ])}
          />
          <P>
            Credentials are fixed and shared across every project on the machine
            — this is a local-development convenience, not a production setup.
          </P>
        </>
      )}

      {info.notes?.map((n) => (
        <Callout key={n.title} kind={n.kind} title={n.title}>
          {n.body}
        </Callout>
      ))}

      <Pager prev={prev} next={next} />
    </>
  );
}
