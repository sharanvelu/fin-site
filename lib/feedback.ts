/**
 * Feedback system domain model — single source of truth for request types,
 * their type-specific form fields, and workflow statuses. The public form,
 * the floating-button popup, the admin sidebar, and the admin detail view
 * all render from this data (same philosophy as lib/content.ts).
 */
import { NAV } from "./content";

export const REQUEST_TYPES = [
  "feedback",
  "issue",
  "feature-request",
  "proposing-change",
] as const;

export type RequestType = (typeof REQUEST_TYPES)[number];

export function isRequestType(value: string): value is RequestType {
  return (REQUEST_TYPES as readonly string[]).includes(value);
}

export type FieldDef = {
  /** Key inside the `details` JSONB column. */
  key: string;
  label: string;
  kind: "text" | "textarea" | "select" | "rating";
  required?: boolean;
  placeholder?: string;
  options?: readonly string[];
  rows?: number;
  help?: string;
};

export type RequestTypeDef = {
  slug: RequestType;
  /** "Issue", "Feature request", … */
  label: string;
  /** One-liner shown in the popup and on the form. */
  blurb: string;
  fields: FieldDef[];
};

/** Docs pages a change proposal can target, derived from the sidebar nav. */
const PAGE_OPTIONS: readonly string[] = [
  "Landing page (/)",
  ...NAV.flatMap((section) =>
    section.items.map((item) => `${item.title} (${item.href})`),
  ),
  "Other / site-wide",
];

export const REQUEST_TYPE_DEFS: RequestTypeDef[] = [
  {
    slug: "feedback",
    label: "Feedback",
    blurb: "Share what you think about Fin or this site.",
    fields: [
      {
        key: "rating",
        label: "Overall rating",
        kind: "rating",
        required: true,
      },
      {
        key: "area",
        label: "Area",
        kind: "select",
        options: ["Docs", "CLI", "Website", "Other"],
        required: true,
      },
      {
        key: "message",
        label: "Message",
        kind: "textarea",
        required: true,
        rows: 6,
        placeholder: "What's working well? What isn't?",
      },
    ],
  },
  {
    slug: "issue",
    label: "Issue",
    blurb: "Something is broken or not behaving as documented.",
    fields: [
      {
        key: "description",
        label: "Description",
        kind: "textarea",
        required: true,
        rows: 5,
        placeholder: "What went wrong?",
      },
      {
        key: "steps",
        label: "Steps to reproduce",
        kind: "textarea",
        rows: 4,
        placeholder: "1. Run `fin up`\n2. …",
      },
      {
        key: "expected",
        label: "Expected behavior",
        kind: "textarea",
        rows: 3,
      },
      {
        key: "actual",
        label: "Actual behavior",
        kind: "textarea",
        rows: 3,
      },
      {
        key: "finVersion",
        label: "Fin version",
        kind: "text",
        placeholder: "fin --version",
      },
      {
        key: "platform",
        label: "OS / platform",
        kind: "select",
        options: ["macOS", "Linux", "Windows (WSL)", "Other"],
      },
      {
        key: "severity",
        label: "Severity",
        kind: "select",
        options: ["Low", "Medium", "High", "Critical"],
        required: true,
      },
    ],
  },
  {
    slug: "feature-request",
    label: "Feature request",
    blurb: "Propose something new for Fin or the docs.",
    fields: [
      {
        key: "problem",
        label: "Problem it solves",
        kind: "textarea",
        required: true,
        rows: 4,
        placeholder: "What can't you do today?",
      },
      {
        key: "solution",
        label: "Proposed solution",
        kind: "textarea",
        rows: 4,
      },
      {
        key: "alternatives",
        label: "Alternatives considered",
        kind: "textarea",
        rows: 3,
      },
      {
        key: "priority",
        label: "Priority for you",
        kind: "select",
        options: ["Nice-to-have", "Important", "Blocking"],
      },
    ],
  },
  {
    slug: "proposing-change",
    label: "Proposing change",
    blurb: "Suggest a concrete change to an existing page or behavior.",
    fields: [
      {
        key: "page",
        label: "Page / section affected",
        kind: "select",
        options: PAGE_OPTIONS,
        required: true,
      },
      {
        key: "current",
        label: "Current behavior / content",
        kind: "textarea",
        rows: 4,
      },
      {
        key: "proposed",
        label: "Proposed change",
        kind: "textarea",
        required: true,
        rows: 5,
      },
      {
        key: "reason",
        label: "Reason / motivation",
        kind: "textarea",
        rows: 3,
      },
    ],
  },
];

export function getRequestTypeDef(slug: RequestType): RequestTypeDef {
  const def = REQUEST_TYPE_DEFS.find((d) => d.slug === slug);
  if (!def) throw new Error(`Unknown request type: ${slug}`);
  return def;
}

export const STATUSES = [
  "new",
  "in-review",
  "planned",
  "in-progress",
  "resolved",
  "closed",
] as const;

export type Status = (typeof STATUSES)[number];

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}

/** Label + theme-token classes for status badges. */
export const STATUS_META: Record<Status, { label: string; badge: string }> = {
  new: {
    label: "New",
    badge: "border-term-cyan/40 bg-term-cyan/10 text-term-cyan",
  },
  "in-review": {
    label: "In review",
    badge: "border-term-yellow/40 bg-term-yellow/10 text-term-yellow",
  },
  planned: {
    label: "Planned",
    badge: "border-term-magenta/40 bg-term-magenta/10 text-term-magenta",
  },
  "in-progress": {
    label: "In progress",
    badge: "border-accent/40 bg-accent/10 text-accent",
  },
  resolved: {
    label: "Resolved",
    badge: "border-term-green/40 bg-term-green/10 text-term-green",
  },
  closed: { label: "Closed", badge: "border-border bg-panel text-fg-faint" },
};

/** Deterministic UTC timestamp for server-rendered admin views. */
export function formatTimestamp(value: Date | string): string {
  return `${new Date(value).toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

const MAX_SHORT = 200;
const MAX_LONG = 5000;
const RATING_VALUES = ["1", "2", "3", "4", "5"] as const;

export type Submission = {
  type: RequestType;
  title: string;
  name: string | null;
  email: string | null;
  details: Record<string, string>;
};

export type ValidationResult =
  | { ok: true; submission: Submission }
  | { ok: false; errors: Record<string, string> };

const SAFE_EMAIL =
  /^[A-Za-z0-9._+-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

/**
 * Returns the email only if it is a plain, conservative address; otherwise
 * null. The admin panel renders it as a `mailto:` link, so anything with
 * URL/header syntax (`?`, `&`, `%`, `#`, quotes, spaces, …) must never be
 * stored. The submission itself is not rejected — the address is just dropped.
 */
export function sanitizeEmail(value: string | undefined): string | null {
  const email = (value ?? "").trim();
  if (!email || email.length > 254) return null;
  return SAFE_EMAIL.test(email) ? email : null;
}

/**
 * Server-side validation shared by the submit action. Accepts a plain
 * record (built from FormData) and returns either a clean Submission or
 * per-field error messages keyed by field key ("title", "email", or a
 * type-specific key).
 */
export function validateSubmission(
  type: string,
  raw: Record<string, string>,
): ValidationResult {
  if (!isRequestType(type)) {
    return { ok: false, errors: { type: "Choose a valid request type." } };
  }
  const def = getRequestTypeDef(type);
  const errors: Record<string, string> = {};

  const title = (raw.title ?? "").trim();
  if (!title) errors.title = "Title is required.";
  else if (title.length > MAX_SHORT)
    errors.title = `Keep the title under ${MAX_SHORT} characters.`;

  const name = (raw.name ?? "").trim();
  if (name.length > MAX_SHORT)
    errors.name = `Keep the name under ${MAX_SHORT} characters.`;

  // Never reject on email — just don't store anything unsafe (see sanitizeEmail).
  const email = sanitizeEmail(raw.email);

  const details: Record<string, string> = {};
  for (const field of def.fields) {
    const value = (raw[field.key] ?? "").trim();
    if (!value) {
      if (field.required) errors[field.key] = `${field.label} is required.`;
      continue;
    }
    if (field.kind === "select" && !field.options?.includes(value)) {
      errors[field.key] = `Choose a valid ${field.label.toLowerCase()}.`;
      continue;
    }
    if (
      field.kind === "rating" &&
      !(RATING_VALUES as readonly string[]).includes(value)
    ) {
      errors[field.key] = "Rating must be between 1 and 5.";
      continue;
    }
    const max = field.kind === "textarea" ? MAX_LONG : MAX_SHORT;
    if (value.length > max) {
      errors[field.key] =
        `Keep ${field.label.toLowerCase()} under ${max} characters.`;
      continue;
    }
    details[field.key] = value;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    submission: {
      type,
      title,
      name: name || null,
      email,
      details,
    },
  };
}
