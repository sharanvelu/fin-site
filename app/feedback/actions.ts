"use server";

import { validateSubmission } from "@/lib/feedback";
import { insertFeedback } from "@/lib/feedback-store";

export type SubmitFeedbackState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; errors: Record<string, string> };

export async function submitFeedback(
  _prev: SubmitFeedbackState,
  formData: FormData,
): Promise<SubmitFeedbackState> {
  // Honeypot: real users never fill this hidden field. Pretend success so
  // bots get no signal.
  if (typeof formData.get("company") === "string" && formData.get("company")) {
    return { status: "success" };
  }

  const raw: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") raw[key] = value;
  }

  const result = validateSubmission(raw.type ?? "", raw);
  if (!result.ok) {
    return { status: "error", errors: result.errors };
  }

  try {
    await insertFeedback(result.submission);
  } catch (error) {
    console.error("Failed to save feedback:", error);
    return {
      status: "error",
      errors: { form: "Something went wrong while saving. Please try again." },
    };
  }

  return { status: "success" };
}
