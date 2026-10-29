# Fin docs site

The documentation website for [Fin](https://github.com/sharanvelu/fin) — a fast, plugin-driven CLI
for running local-development Docker containers.

Built with **Next.js 16** (App Router), **React 19**, **Tailwind CSS v4**, and
TypeScript. No external UI or content libraries — components, icons, and the
lightweight code highlighter are all in-repo. The docs are fully static; the
feedback form (`/feedback`) and admin panel (`/ap`) are backed by
[NeonDB](https://neon.com) and are the only dynamic routes.

> This directory is intended to live in its **own repository**. In the Fin CLI
> repo it is git-ignored (see the root `.gitignore`).

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build

```bash
npm run build    # production build — docs are prerendered, /ap is dynamic
npm run start    # serve the production build
```

Other scripts: `npm run lint`, `npm run typecheck`, `npm test`.

## Feedback & admin panel

The public form (`/feedback`, also reachable from the floating button on every
page) stores submissions in NeonDB. `/ap` is an admin panel for triaging them,
protected by OIDC login. Copy `.env.example` to a git-ignored `.env` and fill it
in:

```bash
DATABASE_URL=postgres://…         # NeonDB connection string
APP_URL=https://docs.example.com  # public origin of this site
OIDC_ISSUER=https://idp.example.com/realms/fin
OIDC_CLIENT_ID=…
OIDC_CLIENT_SECRET=…
OIDC_PROVIDER_NAME=Example SSO    # button reads "Login with Example SSO"
OIDC_JIT_PROVISIONING=false       # true = auto-create unknown users as members
ADMIN_IP_ALLOWLIST=               # optional: IPs/CIDRs allowed to reach /ap
```

Register a confidential client at your identity provider (Authorization Code with
PKCE) with the redirect URI `${APP_URL}/ap/auth/callback`.

```bash
npm run db:setup   # creates the feedback, users, and session tables (idempotent)
```

Roles are `admin` (everything, incl. user management at `/ap/users`), `editor`
(view and triage feedback), and `member` (signed in, no access until promoted).
Sign in once, then promote the first admin in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Building the docs does **not** need any of this — the database client and OIDC
config are read lazily, and only `/feedback` submissions and `/ap/**` use them.

## Structure

```
app/
  layout.tsx            # root layout — fonts, metadata, nav + footer
  page.tsx              # landing page
  docs/
    layout.tsx          # docs shell — sidebar + content column
    page.tsx            # Introduction
    installation/…      # one page per docs section
    quickstart/…
    how-it-works/…
    plugs/…
    environment/…
    commands/…
    writing-a-plug/…
    troubleshooting/…
  feedback/             # public feedback form + submit server action
  ap/                   # admin panel (OIDC login, users, feedback list/detail)
components/
  NavBar, Footer, Sidebar      # site chrome
  Terminal                     # static `fin up` terminal mockup
  CodeBlock                    # copyable code with light syntax coloring
  Prose                        # PageHeader, H2/H3, Callout, RefTable, Pager…
  icons                        # inline SVG icons
  FeedbackFab, FeedbackForm    # feedback button + form
  AdminSidebar, LoginButton, StatusBadge, RoleBadge   # admin panel UI
lib/
  content.ts            # single source of truth for commands / env vars / nav
  feedback.ts           # feedback request types, fields, statuses, validation
  feedback-store.ts, users-store.ts, db.ts   # NeonDB access
  auth.ts, oidc.ts, oidc-config.ts, roles.ts, ip-allowlist.ts   # admin auth
scripts/db-setup.mjs    # one-time DB setup
proxy.ts                # optional /ap IP allowlist
```

## Editing content

Command tables, environment-variable tables, and the sidebar navigation are all
driven from `lib/content.ts`. Update that file to keep the site in sync with the
Fin CLI; most pages render directly from it.

## Design

Dark-first, terminal-inspired. Theme tokens (colors, fonts, radii) live in
`app/globals.css` under Tailwind v4's `@theme` block, so utilities like
`bg-panel`, `text-accent`, and `border-border` are generated from them.
