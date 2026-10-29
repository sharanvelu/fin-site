"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { REQUEST_TYPE_DEFS, type RequestType } from "@/lib/feedback";
import { Icon } from "@/components/icons";

/**
 * Floating feedback button shown on every public page. Opens a popup asking
 * for the request type; "Proceed" navigates to /feedback with the choice
 * preselected. Hidden on the feedback page itself and in the admin panel.
 */
export function FeedbackFab() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<RequestType | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (pathname.startsWith("/feedback") || pathname.startsWith("/ap")) {
    return null;
  }

  const proceed = () => {
    if (!selected) return;
    setOpen(false);
    router.push(`/feedback?type=${selected}`);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-accent/40 bg-panel text-accent shadow-lg shadow-bg/60 transition hover:border-accent hover:bg-accent-soft"
      >
        <Icon.chat className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end bg-bg/70 p-5 backdrop-blur-sm sm:items-end"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Send feedback"
        >
          <div
            className="w-full max-w-sm rounded-card border border-border bg-panel p-5 shadow-2xl shadow-bg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-fg">
                  What&apos;s on your mind?
                </h2>
                <p className="mt-1 text-xs text-fg-muted">
                  Pick a request type to get the right form.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1 text-fg-faint transition hover:bg-bg-soft hover:text-fg"
              >
                <Icon.close className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {REQUEST_TYPE_DEFS.map((option) => {
                const active = option.slug === selected;
                return (
                  <button
                    key={option.slug}
                    type="button"
                    onClick={() => setSelected(option.slug)}
                    aria-pressed={active}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-accent bg-accent-soft"
                        : "border-border bg-bg-soft hover:border-accent/50"
                    }`}
                  >
                    <span
                      className={`block text-sm font-medium ${
                        active ? "text-accent" : "text-fg"
                      }`}
                    >
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-fg-muted">
                      {option.blurb}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={proceed}
              disabled={!selected}
              className="mt-4 w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              Proceed
            </button>
          </div>
        </div>
      )}
    </>
  );
}
