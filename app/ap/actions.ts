"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { destroySession, requireAdmin, requireEditor } from "@/lib/auth";
import { isRequestType, isStatus } from "@/lib/feedback";
import { updateFeedbackStatus } from "@/lib/feedback-store";
import { canChangeUser, isRole } from "@/lib/roles";
import { deleteUser, setUserDisabled, updateUserRole } from "@/lib/users-store";

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/ap/login");
}

export async function updateStatus(formData: FormData): Promise<void> {
  await requireEditor();

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

/** Shared by the user-management actions: admin gate, id check, self-guard. */
async function userTarget(formData: FormData): Promise<number> {
  const actor = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid user.");
  }
  if (!canChangeUser(actor.id, id)) {
    throw new Error("You cannot change your own account.");
  }
  return id;
}

export async function setUserRole(formData: FormData): Promise<void> {
  const id = await userTarget(formData);
  const role = String(formData.get("role") ?? "");
  if (!isRole(role)) throw new Error("Invalid role.");
  await updateUserRole(id, role);
  revalidatePath("/ap/users");
}

export async function toggleUserDisabled(formData: FormData): Promise<void> {
  const id = await userTarget(formData);
  const disabled = String(formData.get("disabled") ?? "") === "true";
  await setUserDisabled(id, disabled);
  revalidatePath("/ap/users");
}

export async function removeUser(formData: FormData): Promise<void> {
  const id = await userTarget(formData);
  await deleteUser(id);
  revalidatePath("/ap/users");
}
