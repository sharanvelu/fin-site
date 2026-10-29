"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/ap/actions";

const INPUT_CLASSES =
  "w-full rounded-lg border border-border bg-bg-soft px-3 py-2 text-sm text-fg " +
  "placeholder:text-fg-faint focus:border-accent focus:outline-none";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-fg">
          Username
        </span>
        <input
          type="text"
          name="username"
          autoComplete="username"
          className={INPUT_CLASSES}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-fg">
          Password
        </span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className={INPUT_CLASSES}
        />
      </label>

      {state.error && (
        <p className="rounded-lg border border-term-red/30 bg-term-red/5 px-3 py-2 text-xs text-term-red">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
