import { describe, expect, it } from "vitest";
import {
  REQUEST_TYPES,
  REQUEST_TYPE_DEFS,
  STATUSES,
  STATUS_META,
  isRequestType,
  isStatus,
  sanitizeEmail,
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

  it("rejects an out-of-range rating", () => {
    const result = validateSubmission("feedback", {
      title: "Nice CLI",
      rating: "9",
      area: "CLI",
      message: "Love it",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.rating).toBeTruthy();
  });

  it("drops an unsafe email instead of rejecting the submission", () => {
    const result = validateSubmission("feedback", {
      title: "Nice CLI",
      email: "a@b.co?bcc=evil%40x.com&body=hi",
      rating: "5",
      area: "CLI",
      message: "Love it",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.submission.email).toBeNull();
  });

  it("keeps a plain email", () => {
    const result = validateSubmission("feedback", {
      title: "Nice CLI",
      email: "  sam.o+fin@example.co.uk ",
      rating: "5",
      area: "CLI",
      message: "Love it",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.submission.email).toBe("sam.o+fin@example.co.uk");
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

describe("sanitizeEmail", () => {
  it("accepts ordinary addresses", () => {
    expect(sanitizeEmail("sam@example.com")).toBe("sam@example.com");
    expect(sanitizeEmail("a.b+c_d@sub.example.io")).toBe(
      "a.b+c_d@sub.example.io",
    );
  });

  it("drops anything that could alter a mailto: link", () => {
    for (const bad of [
      "a@b.co?subject=x",
      "a@b.co&body=x",
      "a@b.co%0Abcc=x",
      "a@b.co#frag",
      'a@b.co"',
      "a@b.co,c@d.co",
      "a b@c.de",
      "<a@b.co>",
      "not-an-email",
      "a@b",
      "a@@b.co",
      `${"a".repeat(250)}@b.co`,
      "",
      undefined,
    ]) {
      expect(sanitizeEmail(bad), String(bad)).toBeNull();
    }
  });
});
