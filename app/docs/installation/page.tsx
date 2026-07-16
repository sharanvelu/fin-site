import type { Metadata } from "next";
import { PageHeader, H2, P, Code, Callout, Pager, RefTable } from "@/components/Prose";
import { CodeBlock } from "@/components/CodeBlock";
import { INSTALL_ONE_LINER } from "@/lib/content";

export const metadata: Metadata = {
  title: "Installation",
  description: "Install Fin with a one-line curl command, or manually with git.",
};

export default function InstallationPage() {
  return (
    <>
      <PageHeader
        title="Installation"
        lead="Fin installs with a single curl command — no virtualenv, against your system Python 3.11+."
      />

      <H2 id="prerequisites">Prerequisites</H2>
      <RefTable
        head={["Requirement", "Notes"]}
        rows={[
          ["Docker", "Running locally — Docker Desktop, Colima, Rancher Desktop, or Podman with a Docker-compatible socket. Fin auto-detects the common socket paths."],
          ["Python 3.11+", "On your PATH."],
          ["git", "Used by the installer and by fin plugs install."],
        ]}
      />

      <H2 id="one-liner">One-liner</H2>
      <CodeBlock code={INSTALL_ONE_LINER} lang="bash" />
      <P>The installer:</P>
      <RefTable
        head={["Step", "What happens"]}
        rows={[
          ["1", "Verifies git and a Python 3.11+ interpreter."],
          ["2", <>Clones the repo into <Code>~/.fin-cli</Code> (override with <Code>FIN_HOME_DIR</Code>).</>],
          ["3", <>Installs Python deps for the user, no virtualenv: <Code>pip install --user typer rich docker</Code>.</>],
          ["4", <>Symlinks the <Code>fin</Code> launcher into the first writable PATH dir (tries <Code>/usr/local/bin</Code>, <Code>~/.local/bin</Code>, <Code>~/bin</Code>, <Code>~/.bin</Code>).</>],
        ]}
      />

      <H2 id="installer-overrides">Installer overrides</H2>
      <P>Configure the installer with environment variables:</P>
      <RefTable
        head={["Variable", "Purpose", "Default"]}
        rows={[
          [<Code>FIN_REPO_URL</Code>, "git URL to clone", "the public Fin repo"],
          [<Code>FIN_USE_BRANCH</Code>, "branch/tag to check out", <Code>main</Code>],
          [<Code>FIN_HOME_DIR</Code>, "install location", <Code>$HOME/.fin-cli</Code>],
          [<Code>FIN_BIN_DIR</Code>, "where to place the fin link", "auto-detected writable PATH dir"],
        ]}
      />

      <H2 id="manual">Manual install</H2>
      <CodeBlock
        lang="bash"
        prompt
        code={`git clone https://github.com/<org>/<repo>.git ~/.fin-cli
cd ~/.fin-cli
python3 -m pip install --user typer rich docker
ln -sf ~/.fin-cli/fin /usr/local/bin/fin   # or any writable dir on your PATH
fin --help`}
      />
      <P>
        The <Code>fin</Code> launcher resolves its own real location (following symlinks),
        puts the package on <Code>PYTHONPATH</Code>, and runs <Code>python3 -m fincli</Code>{" "}
        <strong>from the directory you invoked it in</strong> — so the project&apos;s{" "}
        <Code>.env</Code> and bind mounts work correctly.
      </P>

      <Callout kind="warn" title="fin: command not found">
        If the installer&apos;s chosen bin directory isn&apos;t on your PATH, add it — e.g.{" "}
        <Code>export PATH=&quot;$HOME/.local/bin:$PATH&quot;</Code> in your shell profile.
      </Callout>

      <Callout kind="info" title="Conflicting docker package">
        Fin uses the modern <Code>docker</Code> Python SDK. If you hit a{" "}
        <Code>load_config() got an unexpected keyword</Code> error, the abandoned{" "}
        <Code>docker-py</Code> package is shadowing it — run{" "}
        <Code>pip uninstall docker-py</Code> and reinstall <Code>docker</Code>.
      </Callout>

      <Pager
        prev={{ title: "Introduction", href: "/docs" }}
        next={{ title: "Quickstart", href: "/docs/quickstart" }}
      />
    </>
  );
}
