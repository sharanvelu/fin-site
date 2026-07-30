export const FALLBACK_VERSION = "v0.1.7";

/**
 * Fetches the latest Fin CLI release tag from GitHub at build time.
 * Must never fail the build — falls back to FALLBACK_VERSION on any error.
 * Set GITHUB_TOKEN in the build environment to avoid unauthenticated
 * rate limits on CI/Vercel IPs.
 */
export async function getFinVersion(): Promise<string> {
  try {
    const token = process.env.GITHUB_TOKEN;
    const res = await fetch(
      "https://api.github.com/repos/sharanvelu/fin/releases/latest",
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    );
    if (!res.ok) {
      console.warn(
        `[fin-site] GitHub release lookup failed (HTTP ${res.status}); falling back to ${FALLBACK_VERSION}`,
      );
      return FALLBACK_VERSION;
    }
    const data: unknown = await res.json();
    const tag =
      typeof data === "object" &&
      data !== null &&
      "tag_name" in data &&
      typeof (data as { tag_name: unknown }).tag_name === "string"
        ? (data as { tag_name: string }).tag_name.trim()
        : "";
    if (!tag) {
      console.warn(
        `[fin-site] GitHub release response had no tag_name; falling back to ${FALLBACK_VERSION}`,
      );
      return FALLBACK_VERSION;
    }
    return tag.startsWith("v") ? tag : `v${tag}`;
  } catch (err) {
    console.warn(
      `[fin-site] GitHub release lookup threw (${err instanceof Error ? err.message : String(err)}); falling back to ${FALLBACK_VERSION}`,
    );
    return FALLBACK_VERSION;
  }
}
