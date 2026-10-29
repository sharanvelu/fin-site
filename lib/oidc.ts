/**
 * OIDC login flow (Authorization Code + PKCE) on top of openid-client.
 *
 * Server-only. Config is read lazily at request time — never at module load —
 * so the static build works without any OIDC env vars (same rule as lib/db.ts).
 */
import * as client from "openid-client";
import {
  OidcConfigError,
  parseOidcEnv,
  pickName,
  type AuthTransaction,
  type LoginErrorCode,
  type OidcConfig,
} from "./oidc-config";
import type { Identity } from "./users-store";

export class MissingClaimsError extends Error {}

export function getOidcConfig(): OidcConfig {
  return parseOidcEnv(process.env);
}

/**
 * Discovery result cached per process, keyed by issuer + client. A failed
 * discovery is evicted so the next request retries.
 */
let cached: { key: string; promise: Promise<client.Configuration> } | null =
  null;

export function getConfiguration(
  cfg: OidcConfig,
): Promise<client.Configuration> {
  const key = `${cfg.issuer}|${cfg.clientId}`;
  if (cached?.key !== key) {
    const insecure =
      process.env.NODE_ENV !== "production" && cfg.issuer.startsWith("http:");
    const promise = client
      .discovery(
        new URL(cfg.issuer),
        cfg.clientId,
        cfg.clientSecret,
        undefined,
        insecure ? { execute: [client.allowInsecureRequests] } : undefined,
      )
      .then((config) => config);
    promise.catch(() => {
      if (cached?.promise === promise) cached = null;
    });
    cached = { key, promise };
  }
  return cached.promise;
}

export async function startAuthorization(
  cfg: OidcConfig,
  config: client.Configuration,
): Promise<{ url: URL; tx: AuthTransaction }> {
  const v = client.randomPKCECodeVerifier();
  const s = client.randomState();
  const n = client.randomNonce();
  const url = client.buildAuthorizationUrl(config, {
    redirect_uri: cfg.redirectUri,
    scope: cfg.scopes,
    code_challenge: await client.calculatePKCECodeChallenge(v),
    code_challenge_method: "S256",
    state: s,
    nonce: n,
  });
  return { url, tx: { v, s, n } };
}

/**
 * Exchange the callback for tokens and return the verified identity. Passing
 * expectedNonce makes openid-client require and validate the ID token
 * (signature, iss, aud, exp, nonce).
 */
export async function finishAuthorization(
  cfg: OidcConfig,
  config: client.Configuration,
  search: string,
  tx: AuthTransaction,
): Promise<Identity> {
  // Rebuild the URL on the registered redirect URI instead of trusting Host.
  const currentUrl = new URL(search, cfg.redirectUri);
  const tokens = await client.authorizationCodeGrant(config, currentUrl, {
    pkceCodeVerifier: tx.v,
    expectedState: tx.s,
    expectedNonce: tx.n,
  });
  const claims = tokens.claims();
  if (!claims?.sub) throw new MissingClaimsError("ID token has no sub claim.");
  return {
    issuer: cfg.issuer,
    subject: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    name: pickName(claims),
  };
}

export function classifyOidcError(error: unknown): LoginErrorCode {
  if (error instanceof OidcConfigError) return "config";
  if (error instanceof MissingClaimsError) return "claims";
  if (error instanceof client.AuthorizationResponseError) return "idp";
  if (
    error instanceof client.ResponseBodyError ||
    error instanceof client.ClientError
  ) {
    return "exchange";
  }
  return "db";
}
