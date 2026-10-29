# CLAUDE.md — Fin docs site

This is the **documentation website** for the Fin CLI — a standalone Next.js app
(not the CLI itself). The docs are fully static; a small feedback form and an
admin panel (`/ap`) are the only dynamic, NeonDB-backed parts. It is dark-first
and terminal-inspired, with a teal/cyan accent that mirrors Fin's Rich CLI. Docs
pages render from data in `lib/content.ts`; there are no external UI, icon,
content, or syntax-highlighting libraries — everything is in-repo (the only
runtime libraries beyond Next/React are `@neondatabase/serverless` for feedback
storage and `openid-client` for admin login).

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
  hooks/APIs (client today: `NavBar`, `Sidebar`, `CodeBlock`, `PlugCatalog`,
  `FeedbackFab`, `FeedbackForm`, `AdminSidebar`).
- **Docs stay static; only `/feedback` and `/ap/**` may be dynamic.** `/` and
  every `/docs/**` route must always prerender (`○`/`●` in `npm run build`) — no
  server data fetching, no runtime env/DB dependency. `/feedback` (public form,
  submits via a server action) and `/ap/**` (admin panel, reads NeonDB per
  request) are the only routes allowed to be dynamic. No API routes, except the two
  OIDC route handlers under `app/ap/auth/*` (login start + callback). `proxy.ts`
  exists only for the `/ap/**` IP allowlist — its matcher must stay `/ap/:path*`.
- **DB access is lazy and server-only.** `lib/db.ts` builds the Neon client on
  first query, never at module load, so the static build works without
  `DATABASE_URL`. Only server actions and `/ap/**` may query it. Every admin page
  **and** admin server action must call `requireUser()`, `requireEditor()` or
  `requireAdmin()` itself (`lib/auth.ts`). OIDC env is read lazily per request,
  never at module load.
- **`@/` path alias** → repo root (e.g. `@/components/Prose`, `@/lib/content`).
- Adding a docs page = `app/docs/<slug>/page.tsx` (export `metadata` +
  component) **and** add it to `NAV` in `lib/content.ts`.

## Run / build

```bash
npm run dev        # Turbopack dev server at http://localhost:3000
npm run build      # production build (docs prerendered)
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest
npm run db:setup   # create feedback/users/session tables (needs .env)
```

Feedback/admin needs a git-ignored `.env` — copy `.env.example`: `DATABASE_URL`
(NeonDB), `APP_URL`, `OIDC_ISSUER` / `OIDC_CLIENT_ID` / `OIDC_CLIENT_SECRET`, and
optionally `OIDC_PROVIDER_NAME` (login button label), `OIDC_SCOPES`,
`OIDC_JIT_PROVISIONING`, and `ADMIN_IP_ALLOWLIST`. Running `db:setup` changes
database state — don't run it without the user's go-ahead.

## More detail

- **AGENTS.md** — full working guide: the Next 16 warning, project layout,
  conventions, how to add pages/commands, gotchas.
- **DESIGN.md** — architecture, the design-token system, layout/component
  catalog, the CodeBlock highlighter, and the mobile-overflow rules.
