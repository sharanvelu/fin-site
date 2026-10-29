import { describe, expect, it } from "vitest";
import {
  REQUEST_TYPES,
  REQUEST_TYPE_DEFS,
  STATUSES,
  STATUS_META,
  isRequestType,
  isStatus,
  validateSubmission,
} from "@/lib/feedback";

describe("request type defs", () => {
  it("defines every request type exactly once", () => {
    expect(REQUEST_TYPE_DEFS.map((d) => d.slug).sort()).toEqual(
      [...REQUEST_TYPES].sort(),
    );
  });

  it("gives every select field options", () => {
    for (const def of REQUEST_TYPE_DEFS) {
      for (const field of def.fields) {
        if (field.kind === "select") {
          expect(
            field.options?.length,
            `${def.slug}.${field.key}`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it("has badge metadata for every status", () => {
    for (const status of STATUSES) {
      expect(STATUS_META[status].label).toBeTruthy();
    }
  });
});

describe("type guards", () => {
  it("accepts known values and rejects unknown ones", () => {
    expect(isRequestType("issue")).toBe(true);
    expect(isRequestType("nonsense")).toBe(false);
    expect(isStatus("resolved")).toBe(true);
    expect(isStatus("done")).toBe(false);
  });
});

describe("validateSubmission", () => {
  const validIssue = {
    title: "fin up hangs",
    name: "Sam",
    email: "sam@example.com",
    description: "It hangs on the proxy step.",
    severity: "High",
  };

  it("accepts a valid issue and trims/normalizes values", () => {
    const result = validateSubmission("issue", {
      ...validIssue,
      name: "  Sam  ",
      email: "",
      finVersion: "  0.1.7 ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.submission.name).toBe("Sam");
      expect(result.submission.email).toBeNull();
      expect(result.submission.details.finVersion).toBe("0.1.7");
      expect(result.submission.details.severity).toBe("High");
    }
  });

  it("rejects an unknown request type", () => {
    const result = validateSubmission("spam", validIssue);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.type).toBeTruthy();
  });

  it("requires the per-type required fields", () => {
    const result = validateSubmission("issue", { title: "broken" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.description).toBeTruthy();
      expect(result.errors.severity).toBeTruthy();
    }
  });

  it("rejects select values outside the allowed options", () => {
    const result = validateSubmission("issue", {
      ...validIssue,
      severity: "Catastrophic",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.severity).toBeTruthy();
  });

  it("rejects a bad email and an out-of-range rating", () => {
    const result = validateSubmission("feedback", {
      title: "Nice CLI",
      email: "not-an-email",
      rating: "9",
      area: "CLI",
      message: "Love it",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.email).toBeTruthy();
      expect(result.errors.rating).toBeTruthy();
    }
  });

  it("ignores unknown keys instead of storing them", () => {
    const result = validateSubmission("feedback", {
      title: "Hi",
      rating: "5",
      area: "Docs",
      message: "Great docs",
      injected: "evil",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.submission.details.injected).toBeUndefined();
  });
});
