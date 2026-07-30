import type { Metadata } from "next";
import { PageHeader, H2, P, Code, Callout, Pager, RefTable } from "@/components/Prose";

export const metadata: Metadata = {
  title: "Troubleshooting",
  description: "Common Fin errors and how to resolve them, plus the exit-code contract.",
};

export default function TroubleshootingPage() {
  return (
    <>
      <PageHeader
        title="Troubleshooting"
        lead="Common errors and how to resolve them. Fin never shows a raw traceback — every failure is a clean panel with a meaningful exit code."
      />

      <H2 id="docker">Could not connect to Docker</H2>
      <P>
        <Code>&quot;Could not connect to Docker. Is Docker running?&quot;</Code> — Fin
        auto-detects common Docker sockets (Docker Desktop, Colima, Rancher Desktop, Podman,
        and the standard <Code>/var/run/docker.sock</Code>). Start your Docker engine, or set{" "}
        <Code>DOCKER_HOST</Code> explicitly to defer to the Docker SDK&apos;s own handling.
        This is a <em>system</em> error and exits with code <Code>2</Code>.
      </P>

      <H2 id="fin-app">Missing FIN_APP</H2>
      <P>
        <Code>&quot;No primary app plug configured. Set FIN_APP …&quot;</Code> —{" "}
        <Code>fin up</Code> needs <Code>FIN_APP</Code> (or <Code>FIN_PLUG</Code>) set in the
        project&apos;s <Code>.env</Code>.
      </P>

      <H2 id="plug-missing">Plugs not installed</H2>
      <P>
        <Code>fin up</Code> checks that the <Code>FIN_APP</Code> plug and every plug in{" "}
        <Code>FIN_PLUGS</Code> is installed before starting anything. If any are missing it
        warns <Code>&quot;These plugs are not installed: &lt;names&gt;&quot;</Code> and offers
        to install them from the plug catalog (<Code>[Y/n]</Code>, defaults to Yes) — accept
        and it installs them into <Code>~/.fin/plugs</Code> and continues. Decline and it
        aborts (exit code <Code>1</Code>) with a <Code>Plugs Not Installed</Code> panel
        listing the exact <Code>fin plugs install &lt;name&gt;</Code> commands to run
        manually.
      </P>
      <P>
        If a plug still fails to load after installing (e.g.{" "}
        <Code>&quot;App plug &apos;&lt;name&gt;&apos; is not installed.&quot;</Code>), check{" "}
        <Code>fin plugs list</Code> and confirm the plug file exists in your plugs dir{" "}
        (<Code>~/.fin/plugs</Code>).
      </P>

      <H2 id="port">Port already in use</H2>
      <P>
        <Code>&quot;Port In Use&quot;</Code> — another process (often another local reverse
        proxy, or a system web server) is holding port <Code>80</Code>/<Code>443</Code>. Stop
        whatever is listening, or remove the conflicting container, then run{" "}
        <Code>fin up</Code> again. Fin cleans up the half-created container so retries start
        clean.
      </P>

      <H2 id="path">fin: command not found</H2>
      <P>
        The installer warns if its chosen bin directory isn&apos;t on your PATH. Add it — e.g.{" "}
        <Code>export PATH=&quot;$HOME/.local/bin:$PATH&quot;</Code>.
      </P>

      <H2 id="exit-codes">Exit codes</H2>
      <RefTable
        head={["Code", "Meaning"]}
        rows={[
          [<Code>0</Code>, "Success"],
          [<Code>1</Code>, "User error (bad input, missing env, not found)"],
          [<Code>2</Code>, "System / Docker error (daemon down, API failure)"],
        ]}
      />

      <Callout kind="info" title="Still stuck?">
        Run any command with <Code>--help</Code> for usage details, or{" "}
        <Code>fin plugs list</Code> to confirm what&apos;s loaded.
      </Callout>

      <Pager prev={{ title: "Writing a plug", href: "/docs/writing-a-plug" }} />
    </>
  );
}
