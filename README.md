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
page) stores submissions in NeonDB. `/ap` is a login-protected admin panel for
triaging them. Copy the variables below into a git-ignored `.env`:

```bash
DATABASE_URL=postgres://…     # NeonDB connection string
ADMIN_USERNAME=…              # seeded by db:setup
ADMIN_PASSWORD=…
```

```bash
npm run db:setup   # creates tables (idempotent) and seeds/updates the admin
```

Building the docs does **not** need any of this — the database client is lazy
and only `/feedback` submissions and `/ap/**` touch it.

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
  ap/                   # admin panel (login + auth-gated list/detail views)
components/
  NavBar, Footer, Sidebar      # site chrome
  Terminal                     # static `fin up` terminal mockup
  CodeBlock                    # copyable code with light syntax coloring
  Prose                        # PageHeader, H2/H3, Callout, RefTable, Pager…
  icons                        # inline SVG icons
  FeedbackFab, FeedbackForm    # feedback button + form
  AdminSidebar, LoginForm, StatusBadge   # admin panel UI
lib/
  content.ts            # single source of truth for commands / env vars / nav
  feedback.ts           # feedback request types, fields, statuses, validation
  feedback-store.ts, db.ts, auth.ts      # NeonDB access + admin sessions
scripts/db-setup.mjs    # one-time DB setup
```

## Editing content

Command tables, environment-variable tables, and the sidebar navigation are all
driven from `lib/content.ts`. Update that file to keep the site in sync with the
Fin CLI; most pages render directly from it.

## Design

Dark-first, terminal-inspired. Theme tokens (colors, fonts, radii) live in
`app/globals.css` under Tailwind v4's `@theme` block, so utilities like
`bg-panel`, `text-accent`, and `border-border` are generated from them.
