# Agent guide — Fin docs site

This is the documentation **website** for the Fin CLI (a Next.js app), not the
CLI. If a task mentions Fin commands, plugs, or env vars, you are only changing
how they are _rendered_ here — the CLI lives in the parent repo.

## ⚠️ This is NOT the Next.js you know

This project is **Next.js 16** (`16.2.9`) with **React 19** and **Tailwind
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
  layout.tsx              # root layout: fonts, metadata, NavBar + main + Footer, body overflow-x-hidden
  page.tsx                # landing page
  globals.css             # @theme tokens + CSS helpers (.bg-grid, .glow, .prose-fin, …)
  docs/
    layout.tsx            # docs shell: Sidebar + max-w-3xl article column
    page.tsx              # Introduction
    <slug>/page.tsx       # one folder per docs section
components/               # NavBar, Sidebar, Footer, Terminal, CodeBlock, Prose, icons
lib/
  content.ts              # single source of truth: NAV, COMMAND_GROUPS, PROJECT_ENV, SYSTEM_ENV, LABELS, HIGHLIGHTS, INSTALL_ONE_LINER
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
  it — don't hard-code command/env data into a page.
- **Server Components by default; `"use client"` only when required.** Add the
  `"use client"` directive _only_ if a component uses a browser hook or API:
  `usePathname`, `useState`/`useEffect`, event handlers, `navigator.*`. Today
  only `NavBar`, `Sidebar`, and `CodeBlock` are client components. Everything
  else (`Prose`, `Terminal`, `Footer`, `icons`) is a server component — keep it
  that way unless you genuinely need interactivity.
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
- **Keep it static.** No server-only data fetching, no API routes, no databases.
  Every route must prerender (`npm run build` should show `○ (Static)` for all
  routes). Don't introduce runtime env-var dependencies or dynamic rendering.
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
npm run dev      # Turbopack dev server at http://localhost:3000
npm run build    # static, prerendered production build
npm run start    # serve the production build
```

(There is no lint/test script configured; `dev`, `build`, `start` are the only
scripts in `package.json`.)

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
- **Don't add dependencies casually.** This site deliberately ships only
  `next`/`react`/`react-dom`. Icons, prose, and code highlighting are all
  in-repo; prefer extending those over pulling in a library.

See **DESIGN.md** for the full architecture, token list, and component catalog.
