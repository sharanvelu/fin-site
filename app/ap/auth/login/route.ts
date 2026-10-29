import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  TX_COOKIE,
  encodeTransaction,
  loginErrorRedirect,
} from "@/lib/oidc-config";
import {
  getConfiguration,
  getOidcConfig,
  startAuthorization,
} from "@/lib/oidc";

/** Starts the OIDC flow: stash PKCE/state/nonce, then redirect to the IdP. */
export async function GET() {
  let target: string;
  try {
    const cfg = getOidcConfig();
    const config = await getConfiguration(cfg);
    const { url, tx } = await startAuthorization(cfg, config);
    const cookieStore = await cookies();
    cookieStore.set(TX_COOKIE, encodeTransaction(tx), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // lax is required: the IdP -> callback hop is a cross-site top-level GET.
      sameSite: "lax",
      path: "/ap/auth",
      maxAge: 600,
    });
    target = url.href;
  } catch (error) {
    console.error("OIDC login start failed:", error);
    target = loginErrorRedirect("config");
  }
  redirect(target);
}
