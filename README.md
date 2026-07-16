# Fin docs site

The documentation website for [Fin](../README.md) — a fast, plugin-driven CLI
for running local-development Docker containers.

Built with **Next.js 16** (App Router), **React 19**, **Tailwind CSS v4**, and
TypeScript. No external UI or content libraries — components, icons, and the
lightweight code highlighter are all in-repo.

> This directory is intended to live in its **own repository**. In the Fin CLI
> repo it is git-ignored (see the root `.gitignore`).

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build

```bash
npm run build    # static, prerendered output
npm run start    # serve the production build
```

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
components/
  NavBar, Footer, Sidebar      # site chrome
  Terminal                     # static `fin up` terminal mockup
  CodeBlock                    # copyable code with light syntax coloring
  Prose                        # PageHeader, H2/H3, Callout, RefTable, Pager…
  icons                        # inline SVG icons
lib/
  content.ts            # single source of truth for commands / env vars / nav
```

## Editing content

Command tables, environment-variable tables, and the sidebar navigation are all
driven from `lib/content.ts`. Update that file to keep the site in sync with the
Fin CLI; most pages render directly from it.

## Design

Dark-first, terminal-inspired. Theme tokens (colors, fonts, radii) live in
`app/globals.css` under Tailwind v4's `@theme` block, so utilities like
`bg-panel`, `text-accent`, and `border-border` are generated from them.
