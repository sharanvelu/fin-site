/**
 * Plug catalog data for the Fin docs site.
 *
 * Single source of truth for the plug catalog pages (/docs/plugs and
 * /docs/plugs/<plug>). Values mirror the fin-plugs repo — each entry is read
 * straight from plugs/<slug>.py (env_spec, commands, ContainerSpec) and
 * catalog.json. Keep them truthful to the actual plug source.
 */

export type PlugCommandRef = {
  name: string;
  args?: string;
  aliases?: string;
  desc: string;
};

export type PlugEnvRef = {
  name: string;
  required?: boolean;
  default?: string;
  choices?: string;
  desc: string;
};

export type PlugContainerRef = {
  /** Row label, e.g. "Primary container" or the fixed asset name. */
  label: string;
  name: string;
  image: string;
  ports: string;
  volumes: string[];
};

export type PlugNote = {
  kind: "info" | "warn" | "tip";
  title: string;
  body: string;
};

export type Plug = {
  /** Catalog name — equals the plug filename (plugs/<slug>.py). */
  slug: string;
  /** Display title, e.g. "Laravel", "MinIO". */
  title: string;
  type: "APP" | "ASSET";
  version: string;
  /** The plug class's one-line description. */
  summary: string;
  /** Overview paragraphs. */
  overview: string[];
  /** Example .env for using this plug. */
  envExample?: string;
  env: PlugEnvRef[];
  commands: PlugCommandRef[];
  containers: PlugContainerRef[];
  /** Connection details (assets): label/value pairs. */
  connection?: [string, string][];
  notes?: PlugNote[];
};

export const PLUGS: Plug[] = [
  {
    slug: "laravel",
    title: "Laravel",
    type: "APP",
    version: "1.0.0",
    summary:
      "Laravel / PHP application runtime (nginx + php-fpm + supervisord).",
    overview: [
      "Runs your Laravel project in a single container that bundles nginx, php-fpm, and supervisord (the sharanvelu/laravel-php image, tagged by FIN_PHP_VERSION and overridable with FIN_DOCKER_IMAGE). The project directory is bind-mounted at /var/www/html, and the container serves on port 80 behind the Traefik proxy at your FIN_SITE hostname.",
      "The host's ~/.composer directory is shared into the container, so the composer cache and configuration stay warm across projects and container rebuilds. The plug also opts into CA-certificate installation (install_certs) — any .pem/.crt in ~/.fin/certs is installed into the container's trust store on every fin up.",
      "Commands that wrap artisan and composer run interactively: prompts (vendor:publish, make:model, migrate's production guard, composer's questions) work as they would locally. When fin isn't attached to a TTY (piped/CI), execution transparently falls back to streaming.",
    ],
    envExample: `FIN_APP=laravel
FIN_SITE=myapp.localhost
FIN_PHP_VERSION=8.3
FIN_COMPOSER_VERSION=2
FIN_PLUGS=mysql,redis`,
    env: [
      {
        name: "FIN_SITE",
        required: true,
        desc: "Hostname the app is served at (e.g. myapp.localhost).",
      },
      {
        name: "FIN_PHP_VERSION",
        default: "latest",
        desc: "PHP/image tag (e.g. 8.3, 8.2, latest).",
      },
      {
        name: "FIN_COMPOSER_VERSION",
        choices: "1 | 2",
        default: "2",
        desc: "Composer major version.",
      },
      {
        name: "FIN_DOCKER_IMAGE",
        default: "sharanvelu/laravel-php:<FIN_PHP_VERSION>",
        desc: "Override the primary container image.",
      },
    ],
    commands: [
      {
        name: "artisan",
        args: "...",
        aliases: "art",
        desc: "Run an artisan command (interactive — prompts work).",
      },
      {
        name: "composer",
        args: "...",
        desc: "Run composer in the container (interactive).",
      },
      {
        name: "tinker",
        desc: "Open a Laravel tinker session (REPL — exit/Ctrl-D ends it).",
      },
      {
        name: "migrate",
        args: "[fresh|rollback|refresh]",
        desc: "Run migrations — a scope maps to migrate:<scope>.",
      },
      {
        name: "seed",
        args: "[class]",
        desc: "Run database seeders (db:seed, with --class when given).",
      },
      {
        name: "make",
        args: "<type> <name> ...",
        desc: "Run artisan make:<type>.",
      },
      {
        name: "queue",
        args: "[work|listen|restart]",
        desc: "Run the queue (default listen).",
      },
      {
        name: "bash",
        aliases: "shell",
        desc: "Open an interactive shell in the container.",
      },
      { name: "phpunit", args: "...", desc: "Run ./vendor/bin/phpunit." },
      {
        name: "bin",
        args: "<command> ...",
        desc: "Run ./vendor/bin/<command>.",
      },
      { name: "php", args: "...", desc: "Run the php binary." },
    ],
    containers: [
      {
        label: "Primary container",
        name: "<project>-web",
        image: "sharanvelu/laravel-php:<FIN_PHP_VERSION>",
        ports: "80 (random host port — Traefik routes by FIN_SITE)",
        volumes: [
          "project directory → /var/www/html",
          "~/.composer → /root/.composer (shared composer cache)",
        ],
      },
    ],
    notes: [
      {
        kind: "tip",
        title: "CA certificates",
        body: "The image is Debian-based, so the certificate defaults apply: certs from ~/.fin/certs land in /usr/local/share/ca-certificates and update-ca-certificates runs on every fin up.",
      },
    ],
  },
  {
    slug: "django",
    title: "Django",
    type: "APP",
    version: "1.0.0",
    summary:
      "Django application runtime (python + runserver, live autoreload).",
    overview: [
      "Runs your Django project on the official python:<FIN_PYTHON_VERSION>-slim image (there is no maintained official Django image) with the built-in development server. Because the project directory is bind-mounted at /app, runserver's polling autoreloader picks up source edits and restarts automatically — live refresh on save, reliable across Docker bind mounts including macOS.",
      "On container start the plug optionally apt-installs FIN_APT_PACKAGES (for native deps that compile from source), pip-installs your FIN_REQUIREMENTS file preferring binary wheels, then execs manage.py runserver 0.0.0.0:<FIN_DJANGO_PORT>. A shared fin_pip_cache volume keeps pip's cache warm, so reinstalls after fin down are fast.",
      "Your project's .env is forwarded into the container's environment (Django reads config from os.environ, unlike Laravel which reads the mounted .env file directly). Fin's own FIN_* control variables are stripped so they don't leak into the app. PYTHONUNBUFFERED streams runserver output to fin logs, and PYTHONDONTWRITEBYTECODE keeps .pyc files out of the mounted volume.",
    ],
    envExample: `FIN_APP=django
FIN_SITE=myapp.localhost
FIN_PYTHON_VERSION=3.12
FIN_PLUGS=postgres,redis

# Native build deps for e.g. psycopg2 / mysqlclient / lxml:
# FIN_APT_PACKAGES=build-essential libpq-dev`,
    env: [
      {
        name: "FIN_SITE",
        required: true,
        desc: "Hostname the app is served at (e.g. myapp.localhost).",
      },
      {
        name: "FIN_PYTHON_VERSION",
        default: "3.12",
        desc: "Python image tag (e.g. 3.12, 3.11, 3.13). Pick one your pinned packages support — e.g. Django 4.1 supports Python ≤ 3.11.",
      },
      {
        name: "FIN_DJANGO_PORT",
        default: "8000",
        desc: "Port runserver binds inside the container (int).",
      },
      {
        name: "FIN_REQUIREMENTS",
        default: "requirements.txt",
        desc: "Requirements file installed on container start.",
      },
      {
        name: "FIN_APT_PACKAGES",
        default: "(empty)",
        desc: "Space-separated apt packages installed before pip — for native deps, e.g. build-essential libpq-dev.",
      },
      {
        name: "FIN_DOCKER_IMAGE",
        default: "python:<FIN_PYTHON_VERSION>-slim",
        desc: "Override the primary container image.",
      },
    ],
    commands: [
      {
        name: "manage",
        args: "<cmd> ...",
        desc: "Run a manage.py command (passthrough). Prompting subcommands (shell, dbshell, createsuperuser, changepassword) attach stdin automatically.",
      },
      { name: "migrate", args: "...", desc: "Apply database migrations." },
      {
        name: "makemigrations",
        args: "...",
        aliases: "mm",
        desc: "Create new migrations from model changes.",
      },
      { name: "shell", desc: "Open the Django shell (interactive)." },
      { name: "dbshell", desc: "Open the database shell (interactive)." },
      {
        name: "createsuperuser",
        aliases: "csu",
        desc: "Create a Django superuser (interactive).",
      },
      { name: "collectstatic", args: "...", desc: "Collect static files." },
      { name: "test", args: "...", desc: "Run the Django test suite." },
      {
        name: "startapp",
        args: "<name> [path]",
        desc: "Scaffold a new Django app.",
      },
      { name: "pip", args: "...", desc: "Run pip in the container." },
      {
        name: "python",
        args: "...",
        aliases: "py",
        desc: "Run python — opens an interactive REPL when given no args.",
      },
      {
        name: "bash",
        aliases: "sh",
        desc: "Open an interactive shell in the container.",
      },
    ],
    containers: [
      {
        label: "Primary container",
        name: "<project>-web",
        image: "python:<FIN_PYTHON_VERSION>-slim",
        ports:
          "<FIN_DJANGO_PORT> (random host port — Traefik routes by FIN_SITE)",
        volumes: [
          "project directory → /app",
          "fin_pip_cache → /root/.cache/pip (shared warm pip cache)",
        ],
      },
    ],
    notes: [
      {
        kind: "warn",
        title: "Native dependencies need build tooling",
        body: "The slim image omits compilers. If your project builds psycopg2, Pillow, mysqlclient, lxml, … from source, set FIN_APT_PACKAGES (e.g. build-essential libpq-dev) so they're installed before pip runs.",
      },
    ],
  },
  {
    slug: "mysql",
    title: "MySQL",
    type: "ASSET",
    version: "1.0.0",
    summary: "Shared MySQL database container.",
    overview: [
      "One MySQL 8.0 container shared across every Fin project (fixed name fin_mysql), so multiple projects reuse the same database server. Data persists in the fin_asset_mysql volume across restarts and fin down asset.",
      "fin up auto-creates the project's DB_DATABASE in the shared engine, and polls mysqladmin ping until the server actually accepts connections before doing so — it never races a still-booting engine.",
    ],
    envExample: `FIN_PLUGS=mysql

DB_CONNECTION=mysql
DB_HOST=fin_mysql
DB_PORT=3306
DB_DATABASE=myapp
DB_USERNAME=fin
DB_PASSWORD=password`,
    env: [],
    commands: [],
    containers: [
      {
        label: "Shared container",
        name: "fin_mysql",
        image: "mysql:8.0",
        ports: "3306 → host 3306",
        volumes: ["fin_asset_mysql → /var/lib/mysql"],
      },
    ],
    connection: [
      ["Host (from containers)", "fin_mysql"],
      ["Host (from your machine)", "127.0.0.1:3306"],
      ["Username", "fin"],
      ["Password", "password (also the root password)"],
      ["Default database", "fin"],
    ],
  },
  {
    slug: "postgres",
    title: "PostgreSQL",
    type: "ASSET",
    version: "1.0.0",
    summary: "Shared PostgreSQL database container.",
    overview: [
      "One PostgreSQL 16 (alpine) container shared across every Fin project (fixed name fin_postgres). Data persists in the fin_asset_postgres volume across restarts and fin down asset.",
      "fin up auto-creates the project's DB_DATABASE in the shared engine, and polls pg_isready until the server actually accepts connections before doing so.",
    ],
    envExample: `FIN_PLUGS=postgres

DB_CONNECTION=pgsql
DB_HOST=fin_postgres
DB_PORT=5432
DB_DATABASE=myapp
DB_USERNAME=fin
DB_PASSWORD=password`,
    env: [],
    commands: [],
    containers: [
      {
        label: "Shared container",
        name: "fin_postgres",
        image: "postgres:16-alpine",
        ports: "5432 → host 5432",
        volumes: ["fin_asset_postgres → /var/lib/postgresql/data"],
      },
    ],
    connection: [
      ["Host (from containers)", "fin_postgres"],
      ["Host (from your machine)", "127.0.0.1:5432"],
      ["Username", "fin"],
      ["Password", "password"],
      ["Default database", "fin"],
    ],
  },
  {
    slug: "redis",
    title: "Redis",
    type: "ASSET",
    version: "1.0.0",
    summary: "Shared Redis container.",
    overview: [
      "One Redis 7 (alpine) container shared across every Fin project (fixed name fin_redis). Data persists in the fin_asset_redis volume.",
      "No authentication is configured — connect with just the hostname and port.",
    ],
    envExample: `FIN_PLUGS=redis

REDIS_HOST=fin_redis
REDIS_PORT=6379`,
    env: [],
    commands: [],
    containers: [
      {
        label: "Shared container",
        name: "fin_redis",
        image: "redis:7-alpine",
        ports: "6379 → host 6379",
        volumes: ["fin_asset_redis → /data"],
      },
    ],
    connection: [
      ["Host (from containers)", "fin_redis"],
      ["Host (from your machine)", "127.0.0.1:6379"],
      ["Authentication", "none"],
    ],
  },
  {
    slug: "minio",
    title: "MinIO",
    type: "ASSET",
    version: "1.0.0",
    summary: "Shared MinIO object storage container.",
    overview: [
      "One MinIO container shared across every Fin project (fixed name fin_minio) — an S3-compatible object store for local development. The S3 API listens on port 9000 and the web console on port 9001; both are published to the host, and the console is also routed through the proxy at http://minio.localhost.",
      "Object data is stored in ~/Documents/minio/data on the host (a bind mount, not a named volume), so buckets survive container removal and are directly inspectable.",
    ],
    envExample: `FIN_PLUGS=minio

AWS_ENDPOINT=http://fin_minio:9000
AWS_ACCESS_KEY_ID=fin
AWS_SECRET_ACCESS_KEY=password
AWS_USE_PATH_STYLE_ENDPOINT=true`,
    env: [],
    commands: [],
    containers: [
      {
        label: "Shared container",
        name: "fin_minio",
        image: "quay.io/minio/minio",
        ports: "9000 (S3 API) → host 9000 · 9001 (web console) → host 9001",
        volumes: ["~/Documents/minio/data → /data (host directory)"],
      },
    ],
    connection: [
      ["S3 endpoint (from containers)", "http://fin_minio:9000"],
      ["S3 endpoint (from your machine)", "http://127.0.0.1:9000"],
      ["Web console", "http://minio.localhost · http://127.0.0.1:9001"],
      ["Access key", "fin"],
      ["Secret key", "password"],
    ],
  },
];

export function getPlug(slug: string): Plug | undefined {
  return PLUGS.find((p) => p.slug === slug);
}
