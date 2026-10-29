import type { Metadata } from "next";
import { PageHeader, H2, P, Code, Callout, Pager } from "@/components/Prose";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata: Metadata = {
  title: "Quickstart",
  description: "Bring up a Laravel project with Fin in under a minute.",
};

export default function QuickstartPage() {
  return (
    <>
      <PageHeader
        title="Quickstart (Laravel)"
        lead="Bring up a Laravel project — app container, shared database, and routing — in under a minute."
      />

      <H2 id="configure">1. Configure .env</H2>
      <P>
        From inside a Laravel project, create or edit <Code>.env</Code>:
      </P>
      <CodeBlock
        filename=".env"
        lang="dotenv"
        code={`# Tell Fin which app plug runs this project, and where to serve it.
FIN_APP=laravel
FIN_SITE=myapp.localhost
FIN_PHP_VERSION=8.3
FIN_COMPOSER_VERSION=2

# Auxiliary plugs to bring up with this project.
FIN_PLUGS=mysql,redis

# Standard Laravel DB config — Fin auto-creates the database.
DB_CONNECTION=mysql
DB_HOST=fin_mysql
DB_PORT=3306
DB_DATABASE=myapp
DB_USERNAME=fin
DB_PASSWORD=password

REDIS_HOST=fin_redis`}
      />

      <H2 id="up">2. Bring it up</H2>
      <CodeBlock lang="bash" prompt code={`fin up`} />
      <P>
        Fin starts the Traefik proxy, the shared <Code>fin_mysql</Code> and{" "}
        <Code>fin_redis</Code> containers, your Laravel container, creates the{" "}
        <Code>myapp</Code> database if it&apos;s missing, and prints:
      </P>
      <CodeBlock code={`✓ myapp is up at http://myapp.localhost`} />
      <P>
        Before starting any container, <Code>fin up</Code> pulls every missing
        image — the proxy, each enabled asset, and your app — concurrently (up
        to 4 at a time), so a first run waits roughly as long as the slowest
        single download, not the sum. A live <Code>Pulling images</Code>{" "}
        checklist shows one line per image, then <Code>Pulled N image(s).</Code>{" "}
        Images you already have are never touched, and nothing is printed if all
        of them are present.
      </P>

      <Callout kind="tip" title="No plugs installed yet? fin up handles it">
        On a fresh install, <Code>fin up</Code> notices that the{" "}
        <Code>laravel</Code>, <Code>mysql</Code>, and <Code>redis</Code> plugs
        from your <Code>.env</Code> aren&apos;t installed and asks{" "}
        <Code>Do you want to install them to proceed?</Code> Accept (the default
        is Yes) and it fetches each from the plug catalog into{" "}
        <Code>~/.fin/plugs</Code>, then continues — no separate{" "}
        <Code>fin plugs install</Code> step needed.
      </Callout>

      <Callout kind="info" title="Connecting to shared assets">
        Assets are reachable on their service hostnames from inside containers:{" "}
        <Code>DB_HOST=fin_mysql</Code>, <Code>REDIS_HOST=fin_redis</Code>,{" "}
        <Code>fin_postgres</Code>. Credentials are fixed at <Code>fin</Code> /{" "}
        <Code>password</Code> (shared across every project on the machine).
      </Callout>

      <H2 id="tooling">3. Run your tooling</H2>
      <P>Laravel commands run inside the project&apos;s primary container:</P>
      <CodeBlock
        lang="bash"
        prompt
        code={`fin artisan migrate
fin composer require some/package
fin tinker
fin bash`}
      />

      <H2 id="teardown">4. Tear down</H2>
      <CodeBlock
        lang="bash"
        prompt
        code={`fin down          # this project's containers
fin down asset    # shared asset containers
fin down all      # everything Fin manages`}
      />

      <P>
        <Code>down</Code> stops running containers gracefully (waiting up to
        ~10s for each process to exit) and then removes them. Add{" "}
        <Code>-f</Code> to force-remove immediately, or use{" "}
        <Code>fin stop</Code> to stop containers and leave them in place.
        Containers are handled in parallel, with a live checklist:
      </P>
      <CodeBlock
        code={`Stopping containers
✓ Stopped myapp-web
✓ Stopped fin_mysql
✓ Stopped fin_redis
Removing containers
✓ Removed myapp-web
✗ fin_mysql — <error message>
✓ Removed fin_redis
⚠ Could not remove 1 of 3 containers. Retry with -f to force-remove.`}
      />
      <P>
        One container failing never aborts the others, and the exit code stays{" "}
        <Code>0</Code>.
      </P>

      <Callout kind="warn" title="down all is global">
        <Code>fin down all</Code> removes <em>every</em> Fin-managed container
        across all projects — including other projects&apos; app containers. Use
        plain <Code>fin down</Code> to scope to the current project.
      </Callout>

      <Pager
        prev={{ title: "Installation", href: "/docs/installation" }}
        next={{ title: "How it works", href: "/docs/how-it-works" }}
      />
    </>
  );
}
