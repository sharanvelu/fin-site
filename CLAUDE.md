# CLAUDE.md — Fin docs site

This is the **documentation website** for the Fin CLI — a standalone, fully
static Next.js app (not the CLI itself). It is dark-first and terminal-inspired,
with a teal/cyan accent that mirrors Fin's Rich CLI. Pages render from data in
`lib/content.ts`; there are no external UI, icon, content, or syntax-highlighting
libraries — everything is in-repo.

## Most important conventions

- **Next.js 16 + React 19 + Tailwind v4 — not the versions in your training
  data.** Read `node_modules/next/dist/docs/` before writing framework code.
  Turbopack is the default bundler. Tailwind v4 is CSS-first via `@theme` in
  `app/globals.css` — **there is no `tailwind.config.js`**.
- **Content-driven.** Commands, env vars, sidebar nav, and landing highlights all
  live in `lib/content.ts`. Edit that, not the pages, to change content.
- **Style with theme-token utilities** (`bg-panel`, `text-accent`,
  `border-border`, `text-term-green`), not arbitrary hex. New colors/radii go in
  the `@theme` block.
- **Server Components by default;** add `"use client"` only for browser
  hooks/APIs (only `NavBar`, `Sidebar`, `CodeBlock` are client today).
- **Static site.** No server data fetching or API routes — every route must
  prerender.
- **`@/` path alias** → repo root (e.g. `@/components/Prose`, `@/lib/content`).
- Adding a docs page = `app/docs/<slug>/page.tsx` (export `metadata` +
  component) **and** add it to `NAV` in `lib/content.ts`.

## Run / build

```bash
npm run dev      # Turbopack dev server at http://localhost:3000
npm run build    # static production build
npm run start    # serve the production build
```

## More detail

- **AGENTS.md** — full working guide: the Next 16 warning, project layout,
  conventions, how to add pages/commands, gotchas.
- **DESIGN.md** — architecture, the design-token system, layout/component
  catalog, the CodeBlock highlighter, and the mobile-overflow rules.
