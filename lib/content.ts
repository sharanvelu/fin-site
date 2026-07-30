/**
 * Content data for the Fin docs site.
 *
 * Single source of truth for command tables, env-var tables, and nav — kept in
 * one place so pages stay consistent. All values mirror the Fin CLI's README
 * and source (commands, env vars, labels).
 */

export type NavItem = { title: string; href: string };
export type NavSection = { title: string; items: NavItem[] };

export const NAV: NavSection[] = [
  {
    title: "Getting started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Quickstart", href: "/docs/quickstart" },
    ],
  },
  {
    title: "Concepts",
    items: [
      { title: "How it works", href: "/docs/how-it-works" },
      { title: "Plugs", href: "/docs/plugs" },
      { title: "Environment variables", href: "/docs/environment" },
    ],
  },
  {
    title: "Plug catalog",
    items: [
      { title: "Laravel", href: "/docs/plugs/laravel" },
      { title: "Django", href: "/docs/plugs/django" },
      { title: "MySQL", href: "/docs/plugs/mysql" },
      { title: "PostgreSQL", href: "/docs/plugs/postgres" },
      { title: "Redis", href: "/docs/plugs/redis" },
      { title: "MinIO", href: "/docs/plugs/minio" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "Commands", href: "/docs/commands" },
      { title: "Writing a plug", href: "/docs/writing-a-plug" },
      { title: "Troubleshooting", href: "/docs/troubleshooting" },
    ],
  },
];

export type Command = {
  name: string;
  args?: string;
  desc: string;
  aliases?: string;
};

export type CommandGroup = {
  group: string;
  blurb: string;
  commands: Command[];
};

export const COMMAND_GROUPS: CommandGroup[] = [
  {
    group: "System",
    blurb:
      "Lifecycle commands owned by Fin. Reserved commands always win and are never delegated to a plug.",
    commands: [
      {
        name: "up",
        desc: "Ensure the proxy, start enabled assets, start the primary app container, and auto-create the DB. Requires FIN_APP; offers to install any missing FIN_APP/FIN_PLUGS plugs before starting.",
      },
      {
        name: "down",
        args: "[asset|all] [-f]",
        desc: "Stop and remove containers. No scope = this project; asset = shared assets; all = everything Fin-managed. -f forces removal.",
      },
      {
        name: "stop",
        args: "[asset|all]",
        desc: "Stop containers without removing them. Same scopes as down.",
      },
      {
        name: "config",
        args: "enable|disable|get|list",
        desc: "Manage which asset plugs auto-start with up.",
      },
      {
        name: "asset",
        args: "up|stop|down",
        desc: "Manage the shared asset containers independently of any project.",
      },
    ],
  },
  {
    group: "Containers",
    blurb: "Inspect and interact with Fin-managed containers.",
    commands: [
      {
        name: "ps",
        aliases: "status, containers",
        desc: "List Fin containers grouped by type (App / Asset / Other). -a includes stopped ones; -s/--stats adds live stats.",
      },
      {
        name: "exec",
        args: "<cmd> [args...]",
        desc: "Exec a command in the current project's primary container. Interactive commands (fin exec sh/bash) attach stdin from a real terminal, so they behave like a normal shell.",
      },
      {
        name: "inspect",
        args: "[name]",
        desc: "Rich JSON inspect of a container (default: the project's primary).",
      },
      {
        name: "logs",
        args: "[name] [--follow] [--tail N] [--since X]",
        desc: "Tail logs (default: the project's primary).",
      },
    ],
  },
  {
    group: "Images",
    blurb: "Manage the images Fin uses (the proxy plus every loaded plug's images).",
    commands: [
      { name: "images ls", aliases: "img, list", desc: "List Fin-related images." },
      { name: "images rm", args: "<image> [-f]", desc: "Remove an image." },
      { name: "images prune", desc: "Remove dangling images (asks for confirmation)." },
    ],
  },
  {
    group: "Plugs",
    blurb: "Discover and manage installed plugs.",
    commands: [
      { name: "plugs list", aliases: "ls", desc: "List installed plugs and their commands." },
      { name: "plugs info", args: "<name>", desc: "Show one plug's metadata and path." },
      {
        name: "plugs search",
        args: "<query>",
        desc: "Search the remote plug catalog by name/description.",
      },
      {
        name: "plugs install",
        args: "<name|git-url>",
        desc: "Install a plug by catalog name (e.g. laravel) or from a git URL.",
      },
      { name: "plugs uninstall", args: "<name>", desc: "Remove an installed plug from disk." },
    ],
  },
  {
    group: "AI agents",
    blurb:
      "Generate instruction files that teach AI coding agents (Claude Code, Cursor, Codex, Copilot, …) to run project commands through fin — command tables are built from the installed plugs' metadata. Commit the files; re-run after changing FIN_APP/FIN_PLUGS or upgrading plugs.",
    commands: [
      {
        name: "agents list",
        aliases: "ls",
        desc: "List supported agents, the file each one writes, and whether it's present.",
      },
      {
        name: "agents install",
        args: "[agent ...|all]",
        desc: "Generate instruction files into the current project. Default set: claude, cursor, codex; more by name or with all. Shared files (AGENTS.md, GEMINI.md, …) are only touched inside a fin:agents marker block.",
      },
    ],
  },
  {
    group: "Laravel plug",
    blurb: "Available when FIN_APP=laravel (or laravel is in FIN_PLUGS).",
    commands: [
      { name: "artisan", args: "...", aliases: "art", desc: "Run an artisan command." },
      { name: "composer", args: "...", desc: "Run composer in the container." },
      { name: "tinker", desc: "Open an interactive Laravel tinker session." },
      { name: "migrate", args: "[fresh|rollback|refresh]", desc: "Run migrations." },
      { name: "seed", args: "[class]", desc: "Run database seeders." },
      { name: "make", args: "<type> <name> ...", desc: "Run artisan make:<type>." },
      { name: "queue", args: "[work|listen|restart]", desc: "Run the queue (default listen)." },
      { name: "bash", aliases: "shell", desc: "Open an interactive shell in the container." },
      { name: "phpunit", args: "...", desc: "Run ./vendor/bin/phpunit." },
      { name: "bin", args: "<command> ...", desc: "Run ./vendor/bin/<command>." },
      { name: "php", args: "...", desc: "Run the php binary." },
    ],
  },
];

export type EnvVar = { name: string; meaning: string; default?: string };

export const PROJECT_ENV: EnvVar[] = [
  {
    name: "FIN_APP",
    meaning:
      "Name of the primary app plug for this project (e.g. laravel). Required by fin up. Alias: FIN_PLUG.",
  },
  {
    name: "FIN_PLUGS",
    meaning: "Comma-separated list of auxiliary plugs to consider/start (e.g. mysql,redis).",
  },
  {
    name: "FIN_SITE",
    meaning: "The host the app is routed at (e.g. myapp.localhost). Drives Traefik routing.",
  },
  {
    name: "FIN_CONTAINER_NAME",
    meaning: "Override the project name (defaults to the cwd basename, lowercased).",
  },
  {
    name: "FIN_DOCKER_IMAGE",
    meaning:
      "Override the primary container image. (Laravel) defaults to sharanvelu/laravel-php:<FIN_PHP_VERSION>.",
  },
  {
    name: "FIN_OVERRIDE_ASSETS",
    meaning: "Comma-separated assets to start, overriding the persisted enable flags.",
  },
  {
    name: "FIN_PHP_VERSION",
    meaning: "(Laravel) PHP/image tag, e.g. 8.3, 8.2, latest.",
    default: "latest",
  },
  {
    name: "FIN_COMPOSER_VERSION",
    meaning: "(Laravel) Composer major version, 1 or 2.",
    default: "2",
  },
  {
    name: "DB_CONNECTION, DB_DATABASE, DB_HOST…",
    meaning:
      "Standard Laravel DB config. fin up auto-creates DB_DATABASE in the shared MySQL/Postgres engine.",
  },
  { name: "REDIS_*", meaning: "Standard Redis config (parsed alongside DB_*)." },
];

export const SYSTEM_ENV: EnvVar[] = [
  {
    name: "FIN_DATA_DIR",
    meaning: "Per-user data dir — holds config, registry, certs, and plugs.",
    default: "~/.fin",
  },
  { name: "FIN_PROXY_IMAGE", meaning: "Traefik image for the proxy.", default: "traefik:v3.6" },
  {
    name: "FIN_PLUGS_REPO_RAW",
    meaning:
      "Base raw-files URL that catalog installs fetch plugs/<name>.py from — point at a fork/mirror to install from somewhere else.",
    default: "sharanvelu/fin-plugs @ master",
  },
  {
    name: "FIN_PLUGS_CATALOG_URL",
    meaning: "URL of the catalog.json that fin plugs search reads.",
    default: "fin-plugs latest release asset",
  },
  {
    name: "FIN_PYTHON",
    meaning:
      "Force a specific Python interpreter for the source-path fin launcher. Not used by the prebuilt binary (it embeds its own interpreter).",
    default: "auto-detected",
  },
  {
    name: "DOCKER_HOST",
    meaning: "If set, Fin defers to the Docker SDK's own socket handling.",
    default: "unset",
  },
];

export type Label = { name: string; value: string };
export const LABELS: Label[] = [
  { name: "FIN_MANAGED", value: "always true (the master filter)" },
  { name: "FIN_TYPE", value: "app | asset | global | proxy" },
  { name: "FIN_SERVICE", value: "web, mysql, redis, postgres, proxy, …" },
  { name: "FIN_SITE", value: "the routed URL, or -" },
  { name: "FIN_PROJECT", value: "the project name, or - for shared containers" },
];

export const HIGHLIGHTS = [
  {
    title: "One command up",
    body: "fin up ensures the proxy, starts enabled shared assets, starts your app container, and creates the project database — idempotently.",
    icon: "bolt",
  },
  {
    title: "Plugin-driven",
    body: "Apps and services are plugs: small declarative Python classes that describe containers and contribute commands. Catalog plugs cover Laravel, Django, MySQL, PostgreSQL, Redis and MinIO.",
    icon: "plug",
  },
  {
    title: "Automatic routing",
    body: "A built-in Traefik proxy routes web-exposed containers by hostname — no port juggling, no localhost:xxxx.",
    icon: "route",
  },
  {
    title: "Shared assets",
    body: "One MySQL / Postgres / Redis container is shared across every project, so multiple apps reuse the same database server.",
    icon: "stack",
  },
  {
    title: "Friendly errors",
    body: "No raw tracebacks — Docker problems render as clean panels with meaningful exit codes.",
    icon: "shield",
  },
  {
    title: "No Python required",
    body: "Fin ships as a prebuilt, standalone binary per OS/arch that embeds its own Python interpreter — no Python, pip, or virtualenv on your machine. Just Docker.",
    icon: "feather",
  },
];

export const INSTALL_ONE_LINER =
  'bash -c "$(curl -fsSL https://raw.githubusercontent.com/sharanvelu/fin/master/install.sh)"';

/** Environment overrides read by install.sh (not by the fin binary itself). */
export const INSTALLER_ENV: EnvVar[] = [
  {
    name: "FIN_VERSION",
    meaning:
      "Release to install — \"latest\" resolves via GitHub's releases/latest redirect to the newest published release; a version like 0.1.0 pins the immutable v0.1.0 release.",
    default: "latest",
  },
  {
    name: "FIN_HOME_DIR",
    meaning: "Install location — the package root holding the fin executable and its _internal/ runtime.",
    default: "$HOME/.local/lib/fin-cli",
  },
  {
    name: "FIN_BIN_DIR",
    meaning: "Where the fin symlink is placed.",
    default: "auto-detected writable PATH dir",
  },
  {
    name: "FIN_DATA_DIR",
    meaning: "Per-user data dir — the plugs directory is created at <FIN_DATA_DIR>/plugs.",
    default: "$HOME/.fin",
  },
  {
    name: "FIN_RELEASE_REPO",
    meaning: "GitHub repo hosting the release tarballs.",
    default: "sharanvelu/fin",
  },
];
