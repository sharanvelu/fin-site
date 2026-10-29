import { describe, expect, it } from "vitest";
import {
  ROLES,
  ROLE_META,
  canChangeUser,
  canManageUsers,
  canTriage,
  displayName,
  isRole,
} from "@/lib/roles";

describe("roles", () => {
  it("has metadata for every role", () => {
    for (const role of ROLES) {
      expect(ROLE_META[role].label).toBeTruthy();
      expect(ROLE_META[role].badge).toBeTruthy();
    }
  });

  it("isRole accepts only known roles", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("editor")).toBe(true);
    expect(isRole("member")).toBe(true);
    expect(isRole("root")).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });

  it("only admins manage users", () => {
    expect(canManageUsers("admin")).toBe(true);
    expect(canManageUsers("editor")).toBe(false);
    expect(canManageUsers("member")).toBe(false);
  });

  it("admins and editors can triage, members cannot", () => {
    expect(canTriage("admin")).toBe(true);
    expect(canTriage("editor")).toBe(true);
    expect(canTriage("member")).toBe(false);
  });

  it("blocks acting on yourself", () => {
    expect(canChangeUser(1, 1)).toBe(false);
    expect(canChangeUser(1, 2)).toBe(true);
  });

  it("displayName falls back name → email → id", () => {
    expect(displayName({ id: 3, name: "Ada", email: "a@x.io" })).toBe("Ada");
    expect(displayName({ id: 3, name: null, email: "a@x.io" })).toBe("a@x.io");
    expect(displayName({ id: 3, name: null, email: null })).toBe("user #3");
  });
});
