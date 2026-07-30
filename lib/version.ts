const FALLBACK_VERSION = "v0.1.6";

/**
 * Fetches the latest Fin CLI release tag from GitHub at build time.
 * Must never fail the build — falls back to FALLBACK_VERSION on any error.
 */
export async function getFinVersion(): Promise<string> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/sharanvelu/fin/releases/latest",
    );
    if (!res.ok) return FALLBACK_VERSION;
    const data: unknown = await res.json();
    const tag =
      typeof data === "object" &&
      data !== null &&
      "tag_name" in data &&
      typeof (data as { tag_name: unknown }).tag_name === "string"
        ? (data as { tag_name: string }).tag_name.trim()
        : "";
    if (!tag) return FALLBACK_VERSION;
    return tag.startsWith("v") ? tag : `v${tag}`;
  } catch {
    return FALLBACK_VERSION;
  }
}
