"use client";

import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import {
  submitFeedback,
  type SubmitFeedbackState,
} from "@/app/feedback/actions";
import {
  REQUEST_TYPE_DEFS,
  isRequestType,
  type FieldDef,
  type RequestType,
} from "@/lib/feedback";
import { Icon } from "@/components/icons";

const INPUT_CLASSES =
  "w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm text-fg " +
  "placeholder:text-fg-faint focus:border-accent focus:outline-none";

function FieldLabel({
  field,
}: {
  field: Pick<FieldDef, "label" | "required">;
}) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-fg">
      {field.label}
      {field.required && <span className="ml-1 text-term-red">*</span>}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-term-red">{message}</p>;
}

function RatingInput({ name }: { name: string }) {
  const [rating, setRating] = useState(0);
  return (
    <div className="flex items-center gap-2">
      <input type="hidden" name={name} value={rating || ""} />
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setRating(value)}
          aria-label={`${value} out of 5`}
          aria-pressed={rating === value}
          className={`h-10 w-10 rounded-lg border font-mono text-sm transition ${
            value <= rating
              ? "border-accent bg-accent-soft text-accent"
              : "border-border bg-panel text-fg-muted hover:border-accent hover:text-fg"
          }`}
        >
          {value}
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-1 text-xs text-fg-faint">{rating} / 5</span>
      )}
    </div>
  );
}

function Field({ field, error }: { field: FieldDef; error?: string }) {
  return (
    <label className="block">
      <FieldLabel field={field} />
      {field.kind === "textarea" ? (
        <textarea
          name={field.key}
          rows={field.rows ?? 4}
          placeholder={field.placeholder}
          className={INPUT_CLASSES}
        />
      ) : field.kind === "select" ? (
        <select name={field.key} defaultValue="" className={INPUT_CLASSES}>
          <option value="" disabled>
            Select…
          </option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.kind === "rating" ? (
        <RatingInput name={field.key} />
      ) : (
        <input
          type="text"
          name={field.key}
          placeholder={field.placeholder}
          className={INPUT_CLASSES}
        />
      )}
      {field.help && (
        <p className="mt-1.5 text-xs text-fg-faint">{field.help}</p>
      )}
      <FieldError message={error} />
    </label>
  );
}

export function FeedbackForm() {
  const searchParams = useSearchParams();
  const fromQuery = searchParams.get("type") ?? "";
  const [type, setType] = useState<RequestType>(
    isRequestType(fromQuery) ? fromQuery : "feedback",
  );
  const [state, formAction, pending] = useActionState<
    SubmitFeedbackState,
    FormData
  >(submitFeedback, { status: "idle" });

  const errors = state.status === "error" ? state.errors : {};
  const def = REQUEST_TYPE_DEFS.find((d) => d.slug === type)!;

  if (state.status === "success") {
    return (
      <div className="rounded-card border border-term-green/30 bg-term-green/5 p-8 text-center">
        <Icon.check className="mx-auto h-8 w-8 text-term-green" />
        <h2 className="mt-4 text-xl font-semibold text-fg">
          Thanks — your request is in.
        </h2>
        <p className="mt-2 text-sm text-fg-muted">
          We read everything that comes through here. If you left an email,
          we&apos;ll follow up when there&apos;s news.
        </p>
        <a
          href="/feedback"
          className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition hover:bg-accent-strong"
        >
          Submit another request
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      {/* Request type selector */}
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-fg">
          Request type <span className="text-term-red">*</span>
        </legend>
        <input type="hidden" name="type" value={type} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {REQUEST_TYPE_DEFS.map((option) => {
            const active = option.slug === type;
            return (
              <button
                key={option.slug}
                type="button"
                onClick={() => setType(option.slug)}
                aria-pressed={active}
                className={`rounded-card border p-4 text-left transition ${
                  active
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-panel hover:border-accent/50"
                }`}
              >
                <span
                  className={`block text-sm font-semibold ${
                    active ? "text-accent" : "text-fg"
                  }`}
                >
                  {option.label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-fg-muted">
                  {option.blurb}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Common fields */}
      <div className="space-y-5">
        <label className="block">
          <FieldLabel field={{ label: "Title", required: true }} />
          <input
            type="text"
            name="title"
            placeholder="One-line summary"
            className={INPUT_CLASSES}
          />
          <FieldError message={errors.title} />
        </label>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="block">
            <FieldLabel field={{ label: "Name" }} />
            <input
              type="text"
              name="name"
              placeholder="Optional"
              className={INPUT_CLASSES}
            />
            <FieldError message={errors.name} />
          </label>
          <label className="block">
            <FieldLabel field={{ label: "Email" }} />
            <input
              type="text"
              name="email"
              inputMode="email"
              placeholder="Optional — for follow-up"
              className={INPUT_CLASSES}
            />
            <FieldError message={errors.email} />
          </label>
        </div>
      </div>

      {/* Type-specific fields — remount on type change so stale values drop */}
      <div key={type} className="space-y-5 border-t border-border-soft pt-6">
        {def.fields.map((field) => (
          <Field key={field.key} field={field} error={errors[field.key]} />
        ))}
      </div>

      {/* Honeypot — hidden from real users */}
      <div className="hidden" aria-hidden="true">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {errors.form && (
        <div className="rounded-card border border-term-red/30 bg-term-red/5 px-4 py-3 text-sm text-term-red">
          {errors.form}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-bg transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Submitting…" : `Submit ${def.label.toLowerCase()}`}
      </button>
    </form>
  );
}
