/**
 * Data-integrity tests for lib/content.ts — the single source of truth for
 * nav, command tables, env-var tables, and landing highlights. These guard
 * the invariants the pages rely on (unique keys, resolvable routes, icons
 * that actually exist) so a content edit can't silently break a page.
 */
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  COMMAND_GROUPS,
  HIGHLIGHTS,
  INSTALLER_ENV,
  NAV,
  PROJECT_ENV,
  SYSTEM_ENV,
} from "@/lib/content";
import { PLUGS } from "@/lib/plugs";
import { Icon } from "@/components/icons";

const REPO_ROOT = join(__dirname, "..");
const PLUG_SLUGS = new Set(PLUGS.map((p) => p.slug));

/** Map a NAV href to the page file that must exist for it to resolve. */
function pageFileFor(href: string): string {
  return href === "/docs"
    ? join(REPO_ROOT, "app/docs/page.tsx")
    : join(REPO_ROOT, "app", href, "page.tsx");
}

describe("NAV", () => {
  const items = NAV.flatMap((section) => section.items);

  it("has unique section titles and item hrefs", () => {
    const sections = NAV.map((s) => s.title);
    expect(new Set(sections).size).toBe(sections.length);
    const hrefs = items.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("every item has a title and a /docs href", () => {
    for (const item of items) {
      expect(item.title).not.toBe("");
      expect(item.href).toMatch(/^\/docs(\/|$)/);
    }
  });

  it("every href resolves to a real route", () => {
    for (const item of items) {
      const plugMatch = item.href.match(/^\/docs\/plugs\/(.+)$/);
      if (plugMatch) {
        // Served by app/docs/plugs/[plug] with dynamicParams=false — the slug
        // must be in PLUGS or the link 404s.
        expect(PLUG_SLUGS, `${item.href} has no plug`).toContain(plugMatch[1]);
      } else {
        expect(
          existsSync(pageFileFor(item.href)),
          `${item.href} has no page.tsx`,
        ).toBe(true);
      }
    }
  });

  it("lists every catalog plug exactly once", () => {
    const catalog = NAV.find((s) => s.title === "Plug catalog");
    expect(catalog).toBeDefined();
    const slugs = catalog!.items.map(
      (i) => i.href.match(/^\/docs\/plugs\/(.+)$/)?.[1],
    );
    expect(slugs.toSorted()).toEqual([...PLUG_SLUGS].toSorted());
  });
});

describe("COMMAND_GROUPS", () => {
  it("has unique group names, each with a blurb and commands", () => {
    const groups = COMMAND_GROUPS.map((g) => g.group);
    expect(new Set(groups).size).toBe(groups.length);
    for (const group of COMMAND_GROUPS) {
      expect(group.blurb).not.toBe("");
      expect(group.commands.length).toBeGreaterThan(0);
    }
  });

  it("has unique command names within each group, each with a description", () => {
    for (const group of COMMAND_GROUPS) {
      const names = group.commands.map((c) => c.name);
      expect(new Set(names).size).toBe(names.length);
      for (const command of group.commands) {
        expect(command.name).not.toBe("");
        expect(command.desc).not.toBe("");
      }
    }
  });
});

describe("env-var tables", () => {
  it.each([
    ["PROJECT_ENV", PROJECT_ENV],
    ["SYSTEM_ENV", SYSTEM_ENV],
    ["INSTALLER_ENV", INSTALLER_ENV],
  ])("%s has unique names and meanings", (_label, table) => {
    const names = table.map((v) => v.name);
    expect(new Set(names).size).toBe(names.length);
    for (const envVar of table) {
      expect(envVar.name).not.toBe("");
      expect(envVar.meaning).not.toBe("");
    }
  });
});

describe("HIGHLIGHTS", () => {
  it("every highlight uses an icon that exists", () => {
    // app/page.tsx renders Icon[h.icon] — a bad name breaks the landing page.
    for (const highlight of HIGHLIGHTS) {
      expect(Icon[highlight.icon], `Icon.${highlight.icon}`).toBeDefined();
    }
  });
});
