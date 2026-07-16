import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <Sidebar />
        <article className="prose-fin min-w-0 max-w-3xl">{children}</article>
      </div>
    </div>
  );
}
