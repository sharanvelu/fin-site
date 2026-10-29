import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createSession, resolveUser } from "@/lib/auth";
import {
  TX_COOKIE,
  decodeTransaction,
  loginErrorRedirect,
} from "@/lib/oidc-config";
import {
  classifyOidcError,
  finishAuthorization,
  getConfiguration,
  getOidcConfig,
} from "@/lib/oidc";

/** Finishes the OIDC flow and signs the user in (or sends them back with an error). */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const rawTx = cookieStore.get(TX_COOKIE)?.value;
  cookieStore.delete(TX_COOKIE);

  let target = "/ap";
  try {
    const cfg = getOidcConfig();
    const tx = decodeTransaction(rawTx, cfg.clientSecret);
    if (!tx) {
      target = loginErrorRedirect("state");
    } else {
      const config = await getConfiguration(cfg);
      const identity = await finishAuthorization(
        cfg,
        config,
        request.nextUrl.search,
        tx,
      );
      const user = await resolveUser(identity, cfg.jitProvisioning);
      if (!user) {
        target = loginErrorRedirect("unauthorized");
      } else if (user.disabled) {
        target = loginErrorRedirect("disabled");
      } else {
        await createSession(user.id);
      }
    }
  } catch (error) {
    console.error("OIDC callback failed:", error);
    target = loginErrorRedirect(classifyOidcError(error));
  }
  redirect(target);
}
