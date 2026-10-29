import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  LOGIN_ERROR_CODES,
  OidcConfigError,
  buildRedirectUri,
  decodeTransaction,
  encodeTransaction,
  isLoginErrorCode,
  loginErrorMessage,
  loginErrorRedirect,
  normalizeScopes,
  parseBoolean,
  parseOidcEnv,
  pickName,
  providerNameFromEnv,
} from "@/lib/oidc-config";

const ENV = {
  APP_URL: "https://docs.example.com/",
  OIDC_ISSUER: "https://idp.example.com/realms/fin",
  OIDC_CLIENT_ID: "fin",
  OIDC_CLIENT_SECRET: "secret",
};

describe("parseOidcEnv", () => {
  it("parses a minimal env with defaults", () => {
    const cfg = parseOidcEnv(ENV);
    expect(cfg.providerName).toBe("SSO");
    expect(cfg.scopes).toBe("openid profile email");
    expect(cfg.jitProvisioning).toBe(false);
    expect(cfg.appUrl).toBe("https://docs.example.com");
    expect(cfg.redirectUri).toBe("https://docs.example.com/ap/auth/callback");
  });

  it("honors provider name, scopes, and JIT", () => {
    const cfg = parseOidcEnv({
      ...ENV,
      OIDC_PROVIDER_NAME: " Okta ",
      OIDC_SCOPES: "profile  groups",
      OIDC_JIT_PROVISIONING: "TRUE",
    });
    expect(cfg.providerName).toBe("Okta");
    expect(cfg.scopes).toBe("openid profile groups");
    expect(cfg.jitProvisioning).toBe(true);
  });

  it("lists every missing variable", () => {
    expect(() => parseOidcEnv({})).toThrow(OidcConfigError);
    expect(() => parseOidcEnv({ APP_URL: "x" })).toThrow(
      /OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET/,
    );
  });
});

describe("helpers", () => {
  it("parseBoolean", () => {
    for (const v of ["true", "TRUE", "1", "yes", "on"]) {
      expect(parseBoolean(v)).toBe(true);
    }
    for (const v of ["false", "0", "no", "off", "", undefined, "maybe"]) {
      expect(parseBoolean(v)).toBe(false);
    }
    expect(parseBoolean(undefined, true)).toBe(true);
  });

  it("normalizeScopes ensures openid and collapses whitespace", () => {
    expect(normalizeScopes(undefined)).toBe("openid profile email");
    expect(normalizeScopes("  ")).toBe("openid profile email");
    expect(normalizeScopes("email")).toBe("openid email");
    expect(normalizeScopes("openid   email")).toBe("openid email");
  });

  it("buildRedirectUri trims trailing slashes", () => {
    expect(buildRedirectUri("http://localhost:3000///")).toBe(
      "http://localhost:3000/ap/auth/callback",
    );
  });

  it("providerNameFromEnv defaults to SSO", () => {
    expect(providerNameFromEnv({})).toBe("SSO");
    expect(providerNameFromEnv({ OIDC_PROVIDER_NAME: "  " })).toBe("SSO");
    expect(providerNameFromEnv({ OIDC_PROVIDER_NAME: "Google" })).toBe(
      "Google",
    );
  });

  it("pickName precedence", () => {
    expect(
      pickName({ name: "Ada", preferred_username: "ada", email: "a@x.io" }),
    ).toBe("Ada");
    expect(pickName({ preferred_username: "ada", email: "a@x.io" })).toBe(
      "ada",
    );
    expect(pickName({ email: "a@x.io" })).toBe("a@x.io");
    expect(pickName({ name: 5 })).toBeNull();
  });
});

describe("auth transaction cookie", () => {
  const tx = { v: "verifier", s: "state", n: "nonce" };
  const secret = "client-secret";

  it("round-trips with the same secret", () => {
    expect(decodeTransaction(encodeTransaction(tx, secret), secret)).toEqual(
      tx,
    );
  });

  it("rejects a different secret", () => {
    expect(
      decodeTransaction(encodeTransaction(tx, secret), "other"),
    ).toBeNull();
  });

  it("rejects a tampered payload or signature", () => {
    const [payload, sig] = encodeTransaction(tx, secret).split(".");
    const forged = Buffer.from(
      JSON.stringify({ v: "attacker", s: "state", n: "nonce" }),
    ).toString("base64url");
    expect(decodeTransaction(`${forged}.${sig}`, secret)).toBeNull();
    expect(decodeTransaction(`${payload}.${sig}x`, secret)).toBeNull();
    expect(decodeTransaction(`${payload}.`, secret)).toBeNull();
  });

  it("rejects unsigned and garbage values", () => {
    const unsigned = Buffer.from(JSON.stringify(tx)).toString("base64url");
    expect(decodeTransaction(unsigned, secret)).toBeNull();
    expect(decodeTransaction(undefined, secret)).toBeNull();
    expect(decodeTransaction("", secret)).toBeNull();
    expect(decodeTransaction("%%%.%%%", secret)).toBeNull();
    expect(decodeTransaction("a.b.c", secret)).toBeNull();
  });

  it("rejects a correctly signed payload with missing fields", () => {
    const payload = Buffer.from(JSON.stringify({ v: "a", s: "b" })).toString(
      "base64url",
    );
    const sig = createHmac("sha256", `fin_oidc_tx:${secret}`)
      .update(payload)
      .digest("base64url");
    expect(decodeTransaction(`${payload}.${sig}`, secret)).toBeNull();
  });
});

describe("login errors", () => {
  it("every code has a message and a redirect", () => {
    for (const code of LOGIN_ERROR_CODES) {
      expect(loginErrorMessage(code)).toBeTruthy();
      expect(loginErrorRedirect(code)).toBe(`/ap/login?error=${code}`);
    }
  });

  it("isLoginErrorCode", () => {
    expect(isLoginErrorCode("idp")).toBe(true);
    expect(isLoginErrorCode("nope")).toBe(false);
    expect(isLoginErrorCode(undefined)).toBe(false);
  });
});
