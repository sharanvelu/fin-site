import type { Metadata } from "next";
import { PageHeader, H2, H3, P, Code, Callout, Pager, RefTable } from "@/components/Prose";
import { CodeBlock } from "@/components/CodeBlock";
import { INSTALL_ONE_LINER, INSTALLER_ENV } from "@/lib/content";

export const metadata: Metadata = {
  title: "Installation",
  description:
    "Install the prebuilt Fin binary with a one-line curl command — no Python required — or from source for development.",
};

export default function InstallationPage() {
  return (
    <>
      <PageHeader
        title="Installation"
        lead="Fin ships as a prebuilt, standalone binary per OS/arch — it embeds its own Python interpreter, so there's nothing to install but the binary itself. A full install is the binary on your PATH plus plugs in ~/.fin/plugs; the installer does both."
      />

      <H2 id="prerequisites">Prerequisites</H2>
      <RefTable
        head={["Requirement", "Notes"]}
        rows={[
          ["Docker", "Running locally — Docker Desktop, Colima, Rancher Desktop, or Podman with a Docker-compatible socket. Fin auto-detects the common socket paths."],
          ["git", <>Used by the installer to seed the plugs, and by <Code>fin plugs install</Code>. Optional — without it, install plugs manually.</>],
          ["Python 3.11+", <><strong>Only</strong> for installing from source. The prebuilt binary needs no Python, pip, or virtualenv.</>],
        ]}
      />

      <H2 id="one-liner">One-liner (prebuilt binary)</H2>
      <CodeBlock code={INSTALL_ONE_LINER} lang="bash" />
      <P>The installer:</P>
      <RefTable
        head={["Step", "What happens"]}
        rows={[
          ["1", <>Detects your OS/arch and downloads the matching release tarball <Code>fin-&lt;os&gt;-&lt;arch&gt;.tar.gz</Code> (os ∈ <Code>macos</Code>/<Code>linux</Code>, arch ∈ <Code>arm64</Code>/<Code>x64</Code>) from the GitHub Releases of <Code>sharanvelu/fin</Code>.</>],
          ["2", <>Unpacks it into <Code>~/.fin-cli</Code> (override with <Code>FIN_HOME_DIR</Code>), giving <Code>~/.fin-cli/fin/fin</Code> plus its <Code>_internal/</Code> runtime.</>],
          ["3", <>Symlinks <Code>fin</Code> into the first writable PATH dir (tries <Code>/usr/local/bin</Code>, <Code>~/.local/bin</Code>, <Code>~/bin</Code>, <Code>~/.bin</Code>; override with <Code>FIN_BIN_DIR</Code>).</>],
          ["4", <>On macOS, strips the <Code>com.apple.quarantine</Code> attribute so the unsigned binary runs without a Gatekeeper prompt.</>],
          ["5", <>Seeds plugs into <Code>~/.fin/plugs</Code> (override with <Code>FIN_DATA_DIR</Code>) by <Code>git clone</Code>-ing <Code>sharanvelu/fin-plugs</Code> — only if the plugs dir is absent and git is available.</>],
        ]}
      />

      <Callout kind="info" title="Plugs are not bundled in the binary">
        A full install is two pieces: the <Code>fin</Code> binary on your PATH{" "}
        <em>and</em> plugs in <Code>~/.fin/plugs</Code>. Plugs stay as plain{" "}
        <Code>.py</Code> files loaded at runtime — they are seeded from the{" "}
        <Code>fin-plugs</Code> repo, not embedded in the binary.
      </Callout>

      <H2 id="installer-overrides">Installer overrides</H2>
      <P>Configure the installer with environment variables:</P>
      <RefTable
        head={["Variable", "Purpose", "Default"]}
        rows={INSTALLER_ENV.map((v) => [
          <Code key={v.name}>{v.name}</Code>,
          v.meaning,
          v.default ? <Code>{v.default}</Code> : <span className="text-fg-faint">—</span>,
        ])}
      />

      <H2 id="manual">Manual download from Releases</H2>
      <P>
        If you&apos;d rather not pipe a script, grab the tarball for your platform from the
        Releases page of <Code>sharanvelu/fin</Code> and place it yourself:
      </P>
      <CodeBlock
        lang="bash"
        prompt
        code={`# Pick the artifact for your platform, e.g. fin-macos-arm64.tar.gz
tar -C ~/.fin-cli -xzf fin-macos-arm64.tar.gz     # → ~/.fin-cli/fin/fin + _internal/
xattr -dr com.apple.quarantine ~/.fin-cli/fin     # macOS only (unsigned binary)
ln -sf ~/.fin-cli/fin/fin /usr/local/bin/fin      # or any writable dir on your PATH

# Seed the plugs (not bundled in the binary):
git clone https://github.com/sharanvelu/fin-plugs.git ~/.fin/plugs

fin --help`}
      />

      <Callout kind="warn" title="macOS Gatekeeper">
        The quarantine strip is a stopgap for the unsigned binary. For public
        distribution, code-signing + notarization is the proper fix.
      </Callout>

      <H2 id="from-source">Install from source (developers)</H2>
      <P>
        Working on Fin itself (or on a plug) uses the Python source path — no prebuilt
        binary. This needs <strong>Python 3.11+</strong> on your PATH.
      </P>
      <CodeBlock
        lang="bash"
        prompt
        code={`git clone https://github.com/sharanvelu/fin.git
cd fin
python3 -m pip install --user typer rich docker   # runtime deps, no virtualenv

# Then either run the module directly…
python3 -m fincli --help

# …or install the fin console script (editable):
python3 -m pip install --user -e .
fin --help`}
      />
      <P>
        The repo also ships a <Code>fin</Code> bash launcher at its root: it resolves its own
        real location (following symlinks), puts the package on <Code>PYTHONPATH</Code>, and
        runs <Code>python3 -m fincli</Code> <strong>from the directory you invoked it in</strong>{" "}
        — so the project&apos;s <Code>.env</Code> and bind mounts work correctly. Symlink it
        onto your PATH if you prefer it to the console script.
      </P>

      <H3 id="dev-plugs">Plugs for development</H3>
      <P>
        Plugs always load from the fixed <Code>~/.fin/plugs</Code> directory
        (<Code>PLUGS_DIR</Code> is not configurable independently of <Code>FIN_DATA_DIR</Code>).
        Point it at your plugs checkout once:
      </P>
      <CodeBlock lang="bash" prompt code={`ln -s <fin-plugs repo> ~/.fin/plugs`} />

      <Callout kind="warn" title="fin: command not found">
        If the installer&apos;s chosen bin directory isn&apos;t on your PATH, add it — e.g.{" "}
        <Code>export PATH=&quot;$HOME/.local/bin:$PATH&quot;</Code> in your shell profile.
      </Callout>

      <Callout kind="info" title="Conflicting docker package (source installs)">
        The source path uses the modern <Code>docker</Code> Python SDK. If you hit a{" "}
        <Code>load_config() got an unexpected keyword</Code> error, the abandoned{" "}
        <Code>docker-py</Code> package is shadowing it — run{" "}
        <Code>pip uninstall docker-py</Code> and reinstall <Code>docker</Code>. The prebuilt
        binary is unaffected.
      </Callout>

      <Pager
        prev={{ title: "Introduction", href: "/docs" }}
        next={{ title: "Quickstart", href: "/docs/quickstart" }}
      />
    </>
  );
}
