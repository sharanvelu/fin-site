/**
 * OIDC configuration and login-flow helpers — pure (Node built-ins only) so
 * they are unit-testable. Nothing here touches `process.env` or the network:
 * callers pass the env in, and lib/oidc.ts does the openid-client work.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export type OidcConfig = {
  issuer: string;
  clientId: string;
  clientSecret: string;
  providerName: string;
  scopes: string;
  jitProvisioning: boolean;
  appUrl: string;
  redirectUri: string;
};

type Env = Record<string, string | undefined>;

export class OidcConfigError extends Error {}

export const DEFAULT_PROVIDER_NAME = "SSO";
export const DEFAULT_SCOPES = "openid profile email";
export const CALLBACK_PATH = "/ap/auth/callback";

const REQUIRED = [
  "APP_URL",
  "OIDC_ISSUER",
  "OIDC_CLIENT_ID",
  "OIDC_CLIENT_SECRET",
] as const;

export function parseBoolean(
  value: string | undefined,
  fallback = false,
): boolean {
  const v = value?.trim().toLowerCase();
  if (!v) return fallback;
  if (["true", "1", "yes", "on"].includes(v)) return true;
  if (["false", "0", "no", "off"].includes(v)) return false;
  return fallback;
}

/** Collapses whitespace and guarantees the mandatory `openid` scope. */
export function normalizeScopes(value: string | undefined): string {
  const scopes = (value ?? "").split(/\s+/).filter(Boolean);
  if (scopes.length === 0) return DEFAULT_SCOPES;
  if (!scopes.includes("openid")) scopes.unshift("openid");
  return scopes.join(" ");
}

export function buildRedirectUri(appUrl: string): string {
  return `${appUrl.trim().replace(/\/+$/, "")}${CALLBACK_PATH}`;
}

/** Safe for the login page even when the rest of the OIDC env is missing. */
export function providerNameFromEnv(env: Env): string {
  return env.OIDC_PROVIDER_NAME?.trim() || DEFAULT_PROVIDER_NAME;
}

export function parseOidcEnv(env: Env): OidcConfig {
  const missing = REQUIRED.filter((key) => !env[key]?.trim());
  if (missing.length > 0) {
    throw new OidcConfigError(
      `Missing required environment variable(s): ${missing.join(", ")}.`,
    );
  }
  const appUrl = env.APP_URL!.trim().replace(/\/+$/, "");
  return {
    issuer: env.OIDC_ISSUER!.trim(),
    clientId: env.OIDC_CLIENT_ID!.trim(),
    clientSecret: env.OIDC_CLIENT_SECRET!.trim(),
    providerName: providerNameFromEnv(env),
    scopes: normalizeScopes(env.OIDC_SCOPES),
    jitProvisioning: parseBoolean(env.OIDC_JIT_PROVISIONING, false),
    appUrl,
    redirectUri: buildRedirectUri(appUrl),
  };
}

/** Name to show for a signed-in user, from ID-token claims. */
export function pickName(claims: Record<string, unknown>): string | null {
  for (const key of ["name", "preferred_username", "email"]) {
    const value = claims[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/* ---------- transient PKCE / state / nonce cookie ------------------------ */

export const TX_COOKIE = "fin_oidc_tx";

/** v = PKCE code verifier, s = state, n = nonce. */
export type AuthTransaction = { v: string; s: string; n: string };

/** Domain-separated HMAC key derived from the OIDC client secret. */
function signature(payload: string, secret: string): string {
  return createHmac("sha256", `fin_oidc_tx:${secret}`)
    .update(payload)
    .digest("base64url");
}

/**
 * Serialize and sign the transaction: `<base64url json>.<base64url hmac>`.
 * Signing means the callback only trusts a cookie this server issued, so a
 * forged cookie can't trigger a token-endpoint call to the IdP.
 */
export function encodeTransaction(tx: AuthTransaction, secret: string): string {
  const payload = Buffer.from(JSON.stringify(tx), "utf8").toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

/** Verify the signature and parse; any failure yields null. */
export function decodeTransaction(
  value: string | undefined,
  secret: string,
): AuthTransaction | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = Buffer.from(signature(payload, secret));
  const actual = Buffer.from(sig);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (
      parsed &&
      typeof parsed.v === "string" &&
      typeof parsed.s === "string" &&
      typeof parsed.n === "string" &&
      parsed.v &&
      parsed.s &&
      parsed.n
    ) {
      return { v: parsed.v, s: parsed.s, n: parsed.n };
    }
    return null;
  } catch {
    return null;
  }
}

/* ---------- login error codes -------------------------------------------- */

export const LOGIN_ERROR_CODES = [
  "state",
  "idp",
  "exchange",
  "claims",
  "unauthorized",
  "disabled",
  "config",
  "db",
] as const;

export type LoginErrorCode = (typeof LOGIN_ERROR_CODES)[number];

const LOGIN_ERROR_MESSAGES: Record<LoginErrorCode, string> = {
  state: "Your sign-in session expired or was invalid. Try again.",
  idp: "The identity provider rejected the sign-in.",
  exchange: "Sign-in could not be completed. Try again.",
  claims: "The identity provider did not return a user identifier.",
  unauthorized:
    "Your account is not authorized to access this panel. Ask an administrator to add you.",
  disabled: "Your account has been disabled. Contact an administrator.",
  config: "Sign-in is not configured on this server.",
  db: "Could not reach the database. Try again.",
};

export function isLoginErrorCode(value: unknown): value is LoginErrorCode {
  return (
    typeof value === "string" &&
    (LOGIN_ERROR_CODES as readonly string[]).includes(value)
  );
}

export function loginErrorMessage(code: LoginErrorCode): string {
  return LOGIN_ERROR_MESSAGES[code];
}

export function loginErrorRedirect(code: LoginErrorCode): string {
  return `/ap/login?error=${code}`;
}
