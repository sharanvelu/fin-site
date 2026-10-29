"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  authenticate,
  createSession,
  destroySession,
  requireAdmin,
} from "@/lib/auth";
import { isRequestType, isStatus } from "@/lib/feedback";
import { updateFeedbackStatus } from "@/lib/feedback-store";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    return { error: "Enter a username and password." };
  }

  let adminId: number | null = null;
  try {
    const admin = await authenticate(username, password);
    if (admin) {
      await createSession(admin.id);
      adminId = admin.id;
    }
  } catch (error) {
    console.error("Login failed:", error);
    return { error: "Could not reach the database. Try again." };
  }

  if (adminId === null) {
    return { error: "Invalid username or password." };
  }
  redirect("/ap");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/ap/login");
}

export async function updateStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const type = String(formData.get("type") ?? "");
  const status = String(formData.get("status") ?? "");
  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !isRequestType(type) ||
    !isStatus(status)
  ) {
    throw new Error("Invalid status update request.");
  }

  await updateFeedbackStatus(id, status);
  revalidatePath("/ap", "layout");
}
