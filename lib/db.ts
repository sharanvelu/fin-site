import { neon } from "@neondatabase/serverless";

/**
 * Lazy NeonDB client. Initialized on first query — never at module load —
 * so importing this file cannot break the static build when DATABASE_URL
 * is absent. Only server actions and the admin panel (dynamic routes)
 * actually call it.
 */
let client: ReturnType<typeof neon> | null = null;

export function db() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set — add it to .env.");
    }
    client = neon(url);
  }
  return client;
}
