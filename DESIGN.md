# Fin docs site — design & architecture

This is the documentation **website** for Fin (the CLI). It is a standalone
Next.js app, not part of the CLI itself. This document explains how the site is
built, why it is built that way, and the conventions that keep it consistent.

> Scope note: everything here describes the _website_. The Fin CLI it documents
> (commands, plugs, env vars) lives in the parent repo; this app only _renders_
> docs about it. The site is intended to live in its own repository and is
> git-ignored inside the Fin CLI repo.

## Goals & principles

- **Terminal-inspired, dark-first.** The visual language mirrors Fin's Rich CLI
  output: a near-black background, a teal/cyan accent, monospace for anything
  command-shaped, and small "traffic light" dots on code/terminal chrome. Dark
  is the only theme — there is no light mode and no theme toggle.
- **Zero heavy dependencies.** Runtime dependencies are exactly `next`, `react`,
  and `react-dom` (see `package.json`). There is **no** UI kit, no icon library,
  no markdown/MDX pipeline, and no syntax-highlighting library. Icons are inline
  SVG (`components/icons.tsx`), prose primitives are hand-written
  (`components/Prose.tsx`), and code highlighting is a ~40-line custom tokenizer
  (`components/CodeBlock.tsx`). This keeps the bundle tiny and the site fully
  understandable from within the repo.
- **Content-driven.** Command tables, env-var tables, the sidebar nav, and the
  landing-page highlights all come from one module — `lib/content.ts`. Pages are
  thin renderers over that data, so keeping the site in sync with the CLI means
  editing one file.
- **Static.** Every route prerenders. `npm run build` reports `○ (Static)` for
  all routes. There is no server-side data fetching, no database, no API routes,
  no runtime environment dependency.

## Stack

| Piece      | Choice                         | Notes                                                                                                                                                     |
| ---------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework  | **Next.js 16.2.9**, App Router | Turbopack is the default bundler in Next 16 (dev and build).                                                                                              |
| UI runtime | **React 19.2**                 | Server Components by default; `"use client"` only where needed.                                                                                           |
| Styling    | **Tailwind CSS v4**            | CSS-first config via `@theme` in `app/globals.css`. There is **no `tailwind.config.js`**. Wired through `postcss.config.mjs` with `@tailwindcss/postcss`. |
| Language   | **TypeScript** (strict)        | `tsconfig.json`, path alias `@/*` → repo root.                                                                                                            |
| Fonts      | **Geist** + **Geist Mono**     | Loaded with `next/font/google` in `app/layout.tsx`, exposed as CSS vars `--font-geist-sans` / `--font-geist-mono`.                                        |

`next.config.ts` is intentionally empty — defaults only.

## Design-token system (Tailwind v4 `@theme`)

All design tokens are declared in the `@theme { … }` block at the top of
`app/globals.css`. In Tailwind v4 this CSS-first block **is** the configuration:
each token name maps to a generated utility class, so there is no JS config file
to maintain.

Key tokens and the utilities they generate:

| Token (in `@theme`)                                                | Value                             | Generated utilities (examples)                                                          |
| ------------------------------------------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------- |
| `--color-bg`                                                       | `#0a0e14`                         | `bg-bg`, `text-bg`, `border-bg`                                                         |
| `--color-bg-soft`                                                  | `#0e131b`                         | `bg-bg-soft`                                                                            |
| `--color-panel` / `--color-panel-2`                                | `#121823` / `#161d2a`             | `bg-panel`, `bg-panel-2`                                                                |
| `--color-border` / `--color-border-soft`                           | `#20293a` / `#1a212e`             | `border-border`, `border-border-soft`                                                   |
| `--color-fg` / `--color-fg-muted` / `--color-fg-faint`             | `#e6edf3` / `#9aa7b8` / `#6b7888` | `text-fg`, `text-fg-muted`, `text-fg-faint`                                             |
| `--color-accent` / `--color-accent-strong` / `--color-accent-soft` | `#2dd4bf` / `#14b8a6` / `#0d3530` | `text-accent`, `bg-accent`, `border-accent`, `hover:bg-accent-strong`, `bg-accent-soft` |
| `--color-term-cyan/green/yellow/red/magenta`                       | terminal palette                  | `text-term-green`, `bg-term-red/70`, `text-term-yellow`, …                              |
| `--font-mono` / `--font-sans`                                      | Geist Mono / Geist stacks         | `font-mono`, `font-sans`                                                                |
| `--radius-card`                                                    | `14px`                            | `rounded-card` (cards, code blocks, callouts)                                           |

Notes:

- Color tokens automatically participate in every color utility family
  (`bg-*`, `text-*`, `border-*`, plus opacity modifiers like `bg-panel/40`).
- **Always use the generated token utility, never the arbitrary `var()` form.**
  `--radius-card` is consumed as `rounded-card`; the dark-on-accent button text is
  `text-bg`; the code-block / terminal surface is `bg-bg-soft`. Avoid
  `rounded-[var(--radius-card)]`, `text-[var(--color-bg)]`, and similar arbitrary
  `var()` utilities: Tailwind v4's Turbopack **dev** scanner mis-parses them
  against Next's streaming HTML payload and emits broken CSS — a 500 in
  `next dev` that does **not** appear in `next build` (this was a real bug, fixed
  by switching every such usage to its token utility).

Beyond tokens, `globals.css` defines a few **plain CSS helpers** (not Tailwind
utilities):

- `.bg-grid` — the faint teal grid backdrop on the hero.
- `.glow` — the radial teal glow at the top of the landing page.
- `.cursor-blink` — blinking block cursor in the `Terminal` mockup.
- `.animate-fade-up` — entrance animation for hero content (with
  `[animation-delay:…]` arbitrary utilities to stagger).
- `.prose-fin` — long-form docs typography (paragraph color/line-height, inline
  `<code>` chips, `<strong>` weight). Applied once on the `<article>` in the docs
  layout.
- `.anchor-link` / `.group:hover .anchor-link` — reveals the section-link icon on
  heading hover.
- Global resets: `*` border color defaults to the border token, smooth scroll
  with `scroll-padding-top` for anchored headings, custom scrollbar, and
  `::selection` in accent colors.

## Layout architecture

Two nested layouts:

### Root layout — `app/layout.tsx`

- Loads Geist + Geist Mono via `next/font/google` and applies their CSS-var
  classes to `<html>`.
- Owns site `metadata` (`metadataBase`, title template `"%s — Fin docs"`,
  description, keywords, OpenGraph).
- Renders the persistent chrome: `<NavBar />`, `<main>`, `<Footer />`.
- The `<body>` is a flex column (`flex min-h-full flex-col`) with
  **`overflow-x-hidden`** and the base `bg-bg text-fg` colors. The
  `overflow-x-hidden` is load-bearing — see _Responsiveness_ below.

### Docs layout — `app/docs/layout.tsx`

- A centered container (`max-w-7xl`) wrapping a responsive two-column grid:
  `lg:grid-cols-[15rem_minmax(0,1fr)]`. The `minmax(0,1fr)` (not plain `1fr`) is
  deliberate: it lets the content column shrink below its intrinsic width so wide
  code blocks scroll instead of stretching the page.
- Left column: `<Sidebar />`. Right column: an `<article>` with the `prose-fin`
  class, **`min-w-0`**, and `max-w-3xl` for a comfortable reading measure.
- Below the `lg` breakpoint the grid collapses to a single column and the sidebar
  becomes a toggled drawer.

### Sidebar behavior (`components/Sidebar.tsx`)

- Desktop (`lg+`): a sticky aside (`sticky top-24`) with its own scroll region
  (`max-h-[calc(100vh-7rem)] overflow-y-auto`), rendering the `NAV` sections.
- Mobile: a "Menu" button toggles an inline drawer; selecting a link closes it.
- The active link is derived from `usePathname()` (exact match), which is why the
  sidebar is a client component.

## Component catalog

| Component       | Type                        | Why                                                                                                                                                                                                           |
| --------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NavBar`        | **client** (`"use client"`) | Uses `usePathname()` to highlight the active top-level link.                                                                                                                                                  |
| `Sidebar`       | **client**                  | `usePathname()` for active state + `useState` for the mobile drawer. Renders from `NAV`.                                                                                                                      |
| `CodeBlock`     | **client**                  | Clipboard copy (`navigator.clipboard`) + `useState` for the copied flag. Also does the custom highlighting.                                                                                                   |
| `Footer`        | **server**                  | Static links and text; no interactivity.                                                                                                                                                                      |
| `Terminal`      | **server**                  | A static, pre-rendered `fin up` output mockup. The blinking cursor is pure CSS (`.cursor-blink`), so no JS is needed.                                                                                         |
| `Prose` exports | **server**                  | `PageHeader`, `H2`, `H3`, `P`, `Lead`, `Callout`, `RefTable`, `Code`, `Pager` — presentational primitives with no state.                                                                                      |
| `icons`         | **server**                  | Inline SVGs: `FinLogo` plus an `Icon` map (`bolt`, `plug`, `route`, `stack`, `shield`, `feather`, `copy`, `check`, `terminal`, `arrow`, `github`, `menu`, `close`, `link`). All `currentColor`, 1.6px stroke. |

Rule of thumb: a component is a Server Component **unless** it needs a browser
hook (`usePathname`, `useState`, `navigator`, event handlers) — then and only then
does it get `"use client"`. Only three components cross that line.

### CodeBlock highlighting

`CodeBlock` does dependency-free, per-language token coloring driven by its
`lang` prop:

- **Comments** (lines starting with `#`) → `text-fg-faint`, handled first for all
  languages.
- **`dotenv` / `ini`** → split on the first `=`: key in `term-cyan`, `=` faint,
  value in `term-green`.
- **`python`** → split into tokens; a small keyword set (`PY_KEYWORDS`) renders in
  `term-magenta`, quoted strings in `term-green`, and PascalCase identifiers in
  `term-cyan`.
- **`bash` / generic** → the literal token `fin` is accented and bold, and any
  token starting with `-` (flags) renders in `term-yellow`.

It also supports a `prompt` prop that prepends a non-selectable `$ ` to each
non-empty, non-comment line (so users copy clean commands), and a `filename` /
`lang` header bar with traffic-light dots and a hover-reveal copy button. This is
intentionally _good enough_ coloring for the few languages the docs use, not a
general highlighter — the trade-off is zero dependencies and full control.

## Content architecture

`lib/content.ts` is the **single source of truth**. It exports typed data:

- `NAV: NavSection[]` — the sidebar (and the structural map of the docs).
- `COMMAND_GROUPS: CommandGroup[]` — grouped command reference (System,
  Containers, Images, Plugs, Laravel plug).
- `PROJECT_ENV` / `SYSTEM_ENV: EnvVar[]` — env-var tables.
- `LABELS: Label[]` — Docker label reference.
- `HIGHLIGHTS` — landing-page feature cards (each references an `Icon` key).
- `INSTALL_ONE_LINER` — the install command string.

Pages **consume** this data rather than hard-coding it. For example
`app/docs/commands/page.tsx` maps over `COMMAND_GROUPS`, and `app/page.tsx` maps
over `HIGHLIGHTS` (looking each card's icon up in the `Icon` map). Each docs
section is its own folder under `app/docs/<slug>/` whose `page.tsx` exports a
`metadata` object and a default component, composing `Prose` primitives and
`CodeBlock`s. Pages use a `<Pager>` to link prev/next, mirroring the `NAV` order.

This means there are two coupled lists to keep aligned: the **filesystem routes**
under `app/docs/*` and the **`NAV` array** in `content.ts`. Adding a page requires
touching both.

## Responsiveness & overflow handling

The site had a real mobile horizontal-overflow bug. Wide code blocks and the
grid could push the viewport wider than the screen on small devices. The fix is a
three-part rule, all of which must stay in place:

1. **`overflow-x-hidden` on `<body>`** (`app/layout.tsx`) — the backstop that
   prevents any stray wide child from creating a horizontal scrollbar on the
   whole page.
2. **Single-column base grids** — layouts start at `grid-cols-1` (e.g. the hero,
   highlights) and only expand at `sm:`/`lg:` breakpoints. The docs grid uses
   `minmax(0,1fr)` so the content track can shrink.
3. **`min-w-0` on flex/grid children** that contain scrollable content (the docs
   `<article>`, hero columns). Without `min-w-0`, a grid/flex item refuses to
   shrink below the intrinsic width of its content, so a long `<pre>` would blow
   out the layout. With it, the inner `overflow-x-auto` on `<pre>` scrolls
   locally instead.

When editing layout, preserve all three. Code blocks themselves scroll via
`overflow-x-auto` on the `<pre>`; tables via `overflow-x-auto` on their wrapper.

## Accessibility & metadata

- Semantic structure: one `<h1>` per page via `PageHeader`; section headings via
  `H2`/`H3` with stable `id`s and `scroll-mt-24` so anchored links aren't hidden
  under the sticky nav.
- Decorative elements (`.bg-grid`, `.glow`) are `aria-hidden` and
  `pointer-events-none`.
- Interactive icons carry `aria-label` (GitHub link, copy button, section anchor).
- External links use `rel="noreferrer noopener"` with `target="_blank"`.
- Per-page `metadata` exports feed the root title template and description; the
  root layout sets `metadataBase`, OpenGraph, and keywords.

## Key trade-offs

- **Custom highlighter vs. a real one.** We accept limited language coverage and
  naive tokenization to avoid a heavy dependency and keep full styling control.
- **Hand-written prose primitives vs. MDX.** Pages are `.tsx`, not markdown. More
  verbose to author, but fully typed, no build pipeline, and trivially composable
  with `CodeBlock`/`Callout`.
- **Two coupled lists (`NAV` + filesystem).** Slightly more bookkeeping when
  adding a page, in exchange for explicit, ordered navigation that isn't derived
  from a fragile filesystem walk.
- **Dark-only.** No theming abstraction; tokens are concrete hex values. Simpler,
  but a light mode would require reworking the `@theme` block.
- **Fully static.** No personalization or live data, but instant loads, trivial
  hosting, and no runtime surface area.
