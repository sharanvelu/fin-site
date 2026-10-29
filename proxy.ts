import { NextResponse, type NextRequest } from "next/server";
import {
  clientIpFromHeaders,
  isIpAllowed,
  parseAllowlist,
} from "@/lib/ip-allowlist";

/**
 * Optional IP allowlist for the whole admin panel (/ap/**). Unset or empty
 * ADMIN_IP_ALLOWLIST means no restriction. The matcher must stay /ap-only so
 * the docs routes remain static. Not a security boundary on its own for server
 * actions — lib/auth.ts re-checks in every gate.
 */
export function proxy(request: NextRequest) {
  let rules;
  try {
    rules = parseAllowlist(process.env.ADMIN_IP_ALLOWLIST);
  } catch (error) {
    console.error("Invalid ADMIN_IP_ALLOWLIST — denying /ap:", error);
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (rules.length === 0) return NextResponse.next();

  const ip = clientIpFromHeaders(request.headers);
  if (ip && isIpAllowed(ip, rules)) return NextResponse.next();
  return new NextResponse("Forbidden", { status: 403 });
}

export const config = { matcher: ["/ap/:path*"] };
