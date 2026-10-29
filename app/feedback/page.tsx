import type { Metadata } from "next";
import { Suspense } from "react";
import { FeedbackForm } from "@/components/FeedbackForm";
import { PageHeader } from "@/components/Prose";

export const metadata: Metadata = {
  title: "Feedback",
  description:
    "Send feedback, report an issue, request a feature, or propose a change to Fin or its docs.",
};

export default function FeedbackPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Feedback"
        lead="Found a bug, missing a feature, or have thoughts on Fin or these docs? Tell us — every submission lands directly with the maintainers."
      />
      <Suspense fallback={null}>
        <FeedbackForm />
      </Suspense>
    </div>
  );
}
