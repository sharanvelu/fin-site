import type { Metadata } from "next";
import { PageHeader, H2, H3, P, Code, Callout, Pager } from "@/components/Prose";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata: Metadata = {
  title: "Writing a plug",
  description: "Author your own Fin plug — minimal ASSET and APP examples.",
};

const ASSET_PLUG = `from __future__ import annotations

from fincli.plugs.base import ContainerSpec, FinPlug, PlugType, PortMapping, VolumeMount


class MemcachedPlug(FinPlug):
    name = "memcached"
    version = "1.0.0"
    plug_type = PlugType.ASSET
    description = "Shared Memcached container."

    def asset_specs(self, env) -> list[ContainerSpec]:
        return [
            ContainerSpec(
                service="memcached",
                image="memcached:1.6-alpine",
                container_name="fin_memcached",   # fixed, shared name
                ports=[PortMapping(container=11211, host=11211)],
                volumes=[VolumeMount(host="fin_asset_memcached", container="/data")],
            )
        ]`;

const APP_PLUG = `from __future__ import annotations

from fincli.core.env import EnvSpec, EnvVar
from fincli.plugs.base import ContainerSpec, FinPlug, PlugCommand, PlugType, PortMapping
from fincli.plugs.context import PlugContext

WEBROOT = "/usr/share/nginx/html"


class StaticPlug(FinPlug):
    name = "static"
    version = "1.0.0"
    plug_type = PlugType.APP
    description = "Static site served by nginx."

    def env_spec(self) -> EnvSpec:
        # Declared requirements; fin up validates and reports all problems at once.
        return EnvSpec.of([
            EnvVar("FIN_SITE", required=True,
                   description="hostname the site is served at"),
        ])

    def primary_spec(self, env) -> ContainerSpec:
        image = env.get("FIN_DOCKER_IMAGE") or "nginx:stable-alpine"
        return ContainerSpec(
            service="web",
            image=image,
            name_suffix="web",
            ports=[PortMapping(container=80, host=None)],  # Traefik routes it
            web_exposed=True,
            web_port=80,             # loadbalancer port for the router
            workdir_mount=WEBROOT,   # cwd is bind-mounted here by up
        )

    def commands(self):
        return {
            "sh": PlugCommand("sh", _sh, "Open a shell in the container.",
                              aliases=("shell",)),
        }


def _sh(ctx: PlugContext, args: list[str]) -> int:
    return ctx.exec(["sh"], workdir=WEBROOT)`;

export default function WritingAPlugPage() {
  return (
    <>
      <PageHeader
        title="Writing a plug"
        lead="A plug is a Python package under the plugs directory, grouped by type. Only classes that subclass FinPlug count — the loader finds them, instantiates, and calls setup()."
      />

      <H2 id="asset">Minimal ASSET plug</H2>
      <P>
        <Code>Asset/memcached/__init__.py</Code> — a shared service container with a fixed
        name:
      </P>
      <CodeBlock filename="Asset/memcached/__init__.py" lang="python" code={ASSET_PLUG} />
      <P>
        Enable it to auto-start with <Code>fin config enable memcached</Code>, or list it in{" "}
        <Code>FIN_PLUGS</Code>.
      </P>

      <H2 id="app">Minimal APP plug</H2>
      <P><Code>App/static/__init__.py</Code> — a primary container with a command:</P>
      <CodeBlock filename="App/static/__init__.py" lang="python" code={APP_PLUG} />

      <H2 id="anatomy">Anatomy</H2>
      <H3>primary_spec(env)</H3>
      <P>
        (APP) Returns the one primary <Code>ContainerSpec</Code>. Set{" "}
        <Code>web_exposed=True</Code> + <Code>web_port=…</Code> to get Traefik routing from{" "}
        <Code>FIN_SITE</Code>. Set <Code>workdir_mount</Code> and <Code>up</Code> bind-mounts
        the project directory there.
      </P>
      <H3>asset_specs(env)</H3>
      <P>
        (ASSET) Returns shared-container specs, each with a fixed <Code>container_name</Code>.
      </P>
      <H3>commands()</H3>
      <P>
        Maps a name to a <Code>PlugCommand(name, handler, help, aliases)</Code>. Handlers
        receive <Code>(ctx: PlugContext, args: list[str])</Code> and return an exit code. Use{" "}
        <Code>ctx.exec([...], workdir=...)</Code> to run inside the primary container.
      </P>
      <H3>env_spec()</H3>
      <P>
        Declares required/optional vars, <Code>choices</Code>, types, and defaults.{" "}
        <Code>EnvSpec.validate(env)</Code> raises one friendly error listing every problem.
      </P>
      <H3>CA certificates</H3>
      <P>
        Set <Code>install_certs=True</Code> on a <Code>ContainerSpec</Code> and Fin installs
        every <Code>.pem</Code>/<Code>.crt</Code> in <Code>~/.fin/certs</Code> into that
        container&apos;s trust store on each <Code>fin up</Code>. Defaults target Debian
        (<Code>/usr/local/share/ca-certificates</Code> + <Code>update-ca-certificates</Code>);
        override <Code>cert_dir</Code> / <Code>cert_update_cmd</Code> for other bases.
      </P>

      <Callout kind="tip" title="Auto-discovery">
        After adding a plug, <Code>fin plugs list</Code> re-scans the directory and refreshes
        the SQLite registry automatically — no registration step.
      </Callout>

      <Pager
        prev={{ title: "Commands", href: "/docs/commands" }}
        next={{ title: "Troubleshooting", href: "/docs/troubleshooting" }}
      />
    </>
  );
}
