/**
 * Data-integrity tests for lib/plugs.ts — the plug catalog behind
 * /docs/plugs and the statically generated /docs/plugs/[plug] pages.
 */
import { describe, expect, it } from "vitest";
import { PLUGS, getPlug } from "@/lib/plugs";

describe("PLUGS", () => {
  it("has unique, url-safe slugs", () => {
    const slugs = PLUGS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it("every plug has the fields the detail page renders", () => {
    for (const plug of PLUGS) {
      expect(plug.title).not.toBe("");
      expect(plug.summary).not.toBe("");
      expect(plug.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(plug.overview.length).toBeGreaterThan(0);
      expect(plug.containers.length).toBeGreaterThan(0);
    }
  });

  it("APP plugs declare their own FIN_APP in the env example", () => {
    for (const plug of PLUGS.filter((p) => p.type === "APP")) {
      expect(plug.envExample).toContain(`FIN_APP=${plug.slug}`);
      expect(plug.env.length).toBeGreaterThan(0);
      expect(plug.commands.length).toBeGreaterThan(0);
    }
  });

  it("ASSET plugs use the fixed fin_<slug> container name and list connection details", () => {
    for (const plug of PLUGS.filter((p) => p.type === "ASSET")) {
      expect(plug.containers[0].name).toBe(`fin_${plug.slug}`);
      expect(plug.envExample).toContain(`FIN_PLUGS=${plug.slug}`);
      expect(plug.connection?.length).toBeGreaterThan(0);
    }
  });
});

describe("getPlug", () => {
  it("returns each plug by slug", () => {
    for (const plug of PLUGS) expect(getPlug(plug.slug)).toBe(plug);
  });

  it("returns undefined for unknown slugs", () => {
    expect(getPlug("does-not-exist")).toBeUndefined();
  });
});
