"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV } from "@/lib/content";
import { Icon } from "./icons";

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const tree = (
    <nav className="space-y-7">
      {NAV.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-fg-faint">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-3 py-1.5 text-sm transition ${
                      active
                        ? "bg-accent-soft font-medium text-accent"
                        : "text-fg-muted hover:bg-panel hover:text-fg"
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm text-fg-muted lg:hidden"
      >
        {open ? <Icon.close className="h-4 w-4" /> : <Icon.menu className="h-4 w-4" />}
        Menu
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">{tree}</div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="mb-6 rounded-card border border-border bg-panel/50 p-4 lg:hidden">
          {tree}
        </div>
      )}
    </>
  );
}
