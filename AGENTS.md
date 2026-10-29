# Agent guide — Fin docs site

This is the documentation **website** for the Fin CLI (a Next.js app), not the
CLI. If a task mentions Fin commands, plugs, or env vars, you are only changing
how they are _rendered_ here — the CLI lives in the parent repo.

## ⚠️ This is NOT the Next.js you know

This project is **Next.js 16** (`16.2.x`) with **React 19** and **Tailwind
CSS v4**. APIs, conventions, and file structure differ from older training data,
and several things you may "remember" are deprecated or changed.

**Before writing any framework code, read the bundled docs** — they ship with the
installed version and are authoritative:

```
node_modules/next/dist/docs/
  01-app/01-getting-started/   # layouts-and-pages, server-and-client-components, css, fonts, metadata…
  01-app/02-guides/
  01-app/03-api-reference/     # functions, file-conventions, config, 08-turbopack.md
  01-app/01-getting-started/18-upgrading.md   # what changed / deprecations
```

Specifically check `05-server-and-client-components.md`, `11-css.md`,
`13-fonts.md`, `14-metadata-and-og-images.md`, and `08-turbopack.md` before
touching those areas. **Heed deprecation notices** in the upgrading guide rather
than reaching for an older pattern.

Two things that bite agents most:

- **Turbopack is the default bundler in Next 16** (dev and build). Don't add
  webpack config or webpack-specific plugins.
- **Tailwind v4 has no `tailwind.config.js`.** Configuration is CSS-first in
  `app/globals.css` under `@theme { … }`, wired via `postcss.config.mjs`
  (`@tailwindcss/postcss`). Do not create a `tailwind.config.*` file.

## Project layout

```
app/
  layout.tsx              # root layout: fonts, metadata, NavBar + main + Footer + FeedbackFab, body overflow-x-hidden
  page.tsx                # landing page
  globals.css             # @theme tokens + CSS helpers (.bg-grid, .glow, .prose-fin, …)
  docs/
    layout.tsx            # docs shell: Sidebar + max-w-3xl article column
    page.tsx              # Introduction
    <slug>/page.tsx       # one folder per docs section
  feedback/               # public feedback form (page.tsx) + submitFeedback server action (actions.ts)
  ap/                     # admin panel (dynamic, NeonDB-backed)
    actions.ts            # login / logout / updateStatus server actions
    login/page.tsx        # admin sign-in
    (panel)/              # auth-gated shell: layout.tsx, overview, [type]/ list, [type]/[id]/ detail
components/               # NavBar, Sidebar, Footer, Terminal, CodeBlock, PlugCatalog, Prose, icons,
                          # FeedbackFab, FeedbackForm, LoginForm, AdminSidebar, StatusBadge
lib/
  content.ts              # single source of truth: NAV, COMMAND_GROUPS, PROJECT_ENV, SYSTEM_ENV, LABELS, HIGHLIGHTS, INSTALL_ONE_LINER
  feedback.ts             # feedback domain model: request types, per-type fields, statuses, validation
  feedback-store.ts       # feedback queries (server-only)
  db.ts                   # lazy NeonDB client (reads DATABASE_URL on first query)
  auth.ts                 # admin sessions + password hashing, requireAdmin()
scripts/db-setup.mjs      # `npm run db:setup` — creates tables, seeds admin
tests/                    # vitest
next.config.ts            # empty (defaults)
postcss.config.mjs        # Tailwind v4 via @tailwindcss/postcss
tsconfig.json             # strict; path alias @/* -> repo root
```

## The `@/` path alias

`@/*` maps to the repo root (`tsconfig.json`). Import internal modules through it:

```ts
import { CodeBlock } from "@/components/CodeBlock";
import { NAV, COMMAND_GROUPS } from "@/lib/content";
import { PageHeader, H2, P } from "@/components/Prose";
```

Don't use long relative paths (`../../components/...`) across directories.

## Conventions

- **All content goes through `lib/content.ts`.** Command tables, env-var tables,
  the sidebar nav, and the landing highlights are data there. Pages render from
  it — don't hard-code command/env data into a page. (Feedback request types,
  fields, and statuses are likewise data in `lib/feedback.ts`.)
- **Server Components by default; `"use client"` only when required.** Add the
  `"use client"` directive _only_ if a component uses a browser hook or API:
  `usePathname`, `useState`/`useEffect`, event handlers, `navigator.*`. Today
  the client components are `NavBar`, `Sidebar`, `CodeBlock`, `PlugCatalog`,
  `FeedbackFab`, `FeedbackForm`, `LoginForm`, and `AdminSidebar`. Everything
  else (`Prose`, `Terminal`, `Footer`, `icons`, `StatusBadge`) is a server
  component — keep it that way unless you genuinely need interactivity.
- **Style with theme-token utilities, not arbitrary hex — and not arbitrary
  `var()`.** Use the generated utilities: `bg-panel`, `bg-bg-soft`, `text-accent`,
  `text-fg-muted`, `border-border`, `text-term-green`, `rounded-card`, etc. Every
  token in the `@theme` block generates a matching utility, so a `--radius-card`
  token gives you `rounded-card` and `--color-bg-soft` gives you `bg-bg-soft`. If
  you need a new color/radius, add a token to `@theme` rather than inlining a hex
  value. **Do not** write arbitrary `var()` utilities like
  `rounded-[var(--radius-card)]` or `bg-[var(--color-bg-soft)]` — Tailwind v4's
  Turbopack **dev** scanner mis-parses these against Next's streaming HTML and
  produces broken CSS (a 500 in `next dev` that does _not_ surface in
  `next build`). Always use the token utility instead.
- **Docs stay static; only `/feedback` and `/ap/**` may be dynamic.** `/` and
  every `/docs/**` route must always prerender (`npm run build` shows `○`/`●`
  for them). Don't add server data fetching, runtime env-var dependencies, or
  dynamic APIs (`cookies()`, `headers()`, `searchParams`, `connection()`) to the
  landing page, docs pages, or any layout above them — the root layout in
  particular must stay static. `/feedback` (form + server action) and `/ap/**`
  (admin panel, reads NeonDB per request) are the only routes allowed to be
  dynamic. No API routes.
- **Database rules.** The NeonDB client in `lib/db.ts` is lazy — it must never
  run at module load, or the static build breaks when `DATABASE_URL` is unset.
  Only server actions and `/ap/**` query it. Every `/ap` page **and** every admin
  server action calls `requireAdmin()` itself; a layout check is not a security
  boundary. Use the Neon tagged-template client (parameterized) — never string
  concatenation.
- **Reuse the prose primitives.** Build docs pages from `PageHeader`, `H2`, `H3`,
  `P`, `Lead`, `Callout`, `RefTable`, `Code`, `Pager`, and `CodeBlock` rather
  than raw tags, so typography and spacing stay consistent.

## How to add a docs page

1. Create `app/docs/<slug>/page.tsx`. Export a `metadata` object (at minimum
   `title` — the root layout templates it to `"<title> — Fin docs"`) and a
   default component:

   ```tsx
   import type { Metadata } from "next";
   import { PageHeader, H2, P, Pager } from "@/components/Prose";

   export const metadata: Metadata = {
     title: "My section",
     description: "One-line summary for SEO/OpenGraph.",
   };

   export default function MySectionPage() {
     return (
       <>
         <PageHeader title="My section" lead="Intro paragraph." />
         <H2 id="overview">Overview</H2>
         <P>…</P>
         <Pager
           prev={{ title: "Previous", href: "/docs/previous" }}
           next={{ title: "Next", href: "/docs/next" }}
         />
       </>
     );
   }
   ```

2. **Add it to the `NAV` array in `lib/content.ts`** under the right section, with
   matching `title` and `href` (`/docs/<slug>`). The sidebar and active-state
   highlighting are driven by `NAV` — a page not listed there won't appear in
   navigation. Keep `Pager` prev/next consistent with the `NAV` order.

## How to add or edit commands / env vars

Edit `lib/content.ts` — do not edit the rendering pages. Add a `Command` to the
right `CommandGroup` (or a new group), or an `EnvVar` to `PROJECT_ENV` /
`SYSTEM_ENV`. `app/docs/commands/page.tsx` and `app/docs/environment/page.tsx`
re-render automatically from that data. Keep values truthful to the actual Fin
CLI behavior.

## Run / build

```bash
npm install
npm run dev        # Turbopack dev server at http://localhost:3000
npm run build      # production build (docs prerendered, /ap dynamic)
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest run (npm run test:watch to watch)
npm run format     # prettier --write (format:check to verify)
npm run db:setup   # create feedback/admin tables + seed admin from .env
```

Feedback and the admin panel need a `.env` (git-ignored) with `DATABASE_URL`
(NeonDB). `db:setup` also reads `ADMIN_USERNAME` / `ADMIN_PASSWORD` to seed the
admin user. The docs themselves need no env to build.

After changes, `npm run typecheck`, `npm run lint`, `npm test`, and
`npm run build` should all pass.

## Gotchas

- **Tailwind v4 token utilities.** Utilities like `bg-panel` / `text-accent` only
  exist because the matching token exists in the `@theme` block. If a class
  produces no styling, the token is probably missing or misnamed.
- **Stale class output.** If utility classes look stale or missing after editing
  `globals.css`, restart the dev server and/or clear the `.next/` cache, then
  re-run `npm run dev`.
- **Mobile overflow rules are load-bearing.** Keep `overflow-x-hidden` on the
  `<body>`, start grids at `grid-cols-1`, use `minmax(0,1fr)` for the docs
  content track, and keep `min-w-0` on flex/grid children that hold scrollable
  content (wide code blocks). Removing any of these can reintroduce a horizontal
  scroll bug on small screens. See DESIGN.md → _Responsiveness & overflow_.
- **Throwaway artifacts.** Anything under `.playwright-mcp/`, ad-hoc screenshots,
  and `.next/` is disposable build/inspection output — don't commit it or treat
  it as source.
- **Don't add dependencies casually.** Runtime deps are `next`, `react`,
  `react-dom`, and `@neondatabase/serverless` (feedback storage only). Icons,
  prose, and code highlighting are all in-repo; prefer extending those over
  pulling in a library.
- **Build-time version lookup.** `lib/version.ts` fetches the latest Fin release
  from GitHub during the build and falls back to a pinned version on failure
  (you'll see a "GitHub release lookup failed" log when offline) — that is not a
  build error.

See **DESIGN.md** for the full architecture, token list, and component catalog.
