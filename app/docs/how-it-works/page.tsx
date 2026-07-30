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
import { LABELS } from "@/lib/content";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "The proxy, shared assets, container labels, and command resolution order.",
};

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        title="How it works"
        lead="What fin up actually does — the proxy, shared assets, container labels, and how a command is resolved."
      />

      <H2 id="proxy">The proxy</H2>
      <P>
        A single, always-on Traefik container named <Code>fin_proxy</Code>{" "}
        (image <Code>traefik:v3.6</Code>) runs on the Fin network. It uses
        Traefik&apos;s Docker provider with <Code>exposedbydefault=false</Code>,
        so it routes a container <strong>only</strong> when that container
        carries Traefik labels. Entrypoints <Code>web</Code> (<Code>:80</Code>)
        and <Code>websecure</Code> (<Code>:443</Code>) are published to the
        host, and the dashboard lives at <Code>http://traefik.localhost</Code>{" "}
        (its port <Code>:8080</Code> is published to the host too). Both{" "}
        <Code>fin up</Code> and <Code>fin asset up</Code> ensure the proxy is
        running first.
      </P>

      <H2 id="assets">Assets</H2>
      <P>
        Assets are shared, fixed-name containers (<Code>fin_mysql</Code>,{" "}
        <Code>fin_postgres</Code>, <Code>fin_redis</Code>) reused across all
        projects. Which assets start on <Code>up</Code> is resolved by:
      </P>
      <RefTable
        head={["Priority", "Source"]}
        rows={[
          [
            "1",
            <>
              <Code>FIN_OVERRIDE_ASSETS</Code> (comma-separated) — if set, it
              wins outright.
            </>,
          ],
          [
            "2",
            <>
              Every asset enabled via{" "}
              <Code>fin config enable &lt;asset&gt;</Code> (persisted in{" "}
              <Code>~/.fin/config.json</Code>), plus any asset named in{" "}
              <Code>FIN_PLUGS</Code>.
            </>,
          ],
        ]}
      />
      <Callout kind="tip" title="Readiness wait">
        Database assets are polled (<Code>mysqladmin ping</Code> /{" "}
        <Code>pg_isready</Code>) until they actually accept connections before
        Fin creates the project database — so <Code>fin up</Code> never races a
        still-booting engine.
      </Callout>

      <H2 id="labels">Labels and routing</H2>
      <P>
        Every Fin container carries these labels — the master filter is{" "}
        <Code>FIN_MANAGED=true</Code>:
      </P>
      <RefTable
        head={["Label", "Value"]}
        rows={LABELS.map((l) => [<Code key={l.name}>{l.name}</Code>, l.value])}
      />
      <P>
        Web-exposed services additionally get Traefik routing labels derived
        from <Code>FIN_SITE</Code>: a router <Code>rule</Code> (
        <Code>Host(`myapp.localhost`)</Code>, or <Code>HostRegexp(...)</Code>{" "}
        for <Code>*.</Code> wildcards), <Code>entrypoints=web,websecure</Code>,
        a <Code>service</Code> named <Code>&lt;key&gt;_service</Code>, and a
        loadbalancer <Code>server.port</Code> from the plug&apos;s spec. The
        router key is the host with <Code>*.</Code>/<Code>.localhost</Code>{" "}
        stripped and <Code>.</Code>/<Code>-</Code> replaced by <Code>_</Code> (
        <Code>my-app.localhost</Code> → <Code>my_app</Code>).
      </P>

      <H2 id="resolution">Command resolution order</H2>
      <P>
        When you run a sub-command, Fin searches in this order — first match
        wins:
      </P>
      <CodeBlock
        code={`fin <command> [args...]
  1. reserved (system) commands   ← owned by Fin, never delegated
  2. the FIN_APP / FIN_PLUG plug   ← primary app plug
  3. the FIN_PLUGS plugs           ← auxiliary plugs, in declared order
  4. GLOBAL plugs                  ← every plug declaring PlugType.GLOBAL`}
      />
      <P>
        Reserved commands always win and are never delegated to a plug. Plug
        lookup is lazy and de-duplicated by plug name.
      </P>

      <Pager
        prev={{ title: "Quickstart", href: "/docs/quickstart" }}
        next={{ title: "Plugs", href: "/docs/plugs" }}
      />
    </>
  );
}
