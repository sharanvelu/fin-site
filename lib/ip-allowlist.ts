/**
 * IP allowlist for the admin panel (ADMIN_IP_ALLOWLIST) — pure and
 * dependency-free. Entries are comma-separated IPv4/IPv6 addresses or CIDR
 * ranges. An empty list means "no restriction".
 */

export class IpAllowlistError extends Error {}

export type IpRule = { version: 4 | 6; addr: bigint; prefix: number };

type ParsedIp = { version: 4 | 6; addr: bigint };

function parseIpv4(value: string): bigint | null {
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  let addr = BigInt(0);
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    addr = (addr << BigInt(8)) | BigInt(n);
  }
  return addr;
}

function parseIpv6(value: string): bigint | null {
  let text = value;
  // Embedded IPv4 tail (e.g. ::ffff:1.2.3.4) → two hex groups.
  const lastColon = text.lastIndexOf(":");
  if (text.includes(".")) {
    const v4 = parseIpv4(text.slice(lastColon + 1));
    if (v4 === null) return null;
    const hi = Number(v4 >> BigInt(16)).toString(16);
    const lo = Number(v4 & BigInt(0xffff)).toString(16);
    text = `${text.slice(0, lastColon + 1)}${hi}:${lo}`;
  }
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  let groups: string[];
  if (halves.length === 2) {
    const fill = 8 - head.length - tail.length;
    if (fill < 1) return null;
    groups = [...head, ...Array<string>(fill).fill("0"), ...tail];
  } else {
    groups = head;
  }
  if (groups.length !== 8) return null;
  let addr = BigInt(0);
  for (const group of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return null;
    addr = (addr << BigInt(16)) | BigInt(parseInt(group, 16));
  }
  return addr;
}

/** Parses an IP; IPv4-mapped IPv6 (::ffff:a.b.c.d) is normalized to IPv4. */
function parseIp(value: string): ParsedIp | null {
  const text = value.trim();
  if (!text) return null;
  if (text.includes(":")) {
    const addr = parseIpv6(text);
    if (addr === null) return null;
    if (addr >> BigInt(32) === BigInt(0xffff)) {
      return {
        version: 4,
        addr: addr & ((BigInt(1) << BigInt(32)) - BigInt(1)),
      };
    }
    return { version: 6, addr };
  }
  const addr = parseIpv4(text);
  return addr === null ? null : { version: 4, addr };
}

function maskFor(version: 4 | 6, prefix: number): bigint {
  const bits = version === 4 ? 32 : 128;
  if (prefix === 0) return BigInt(0);
  const all = (BigInt(1) << BigInt(bits)) - BigInt(1);
  return (all << BigInt(bits - prefix)) & all;
}

export function parseAllowlist(value: string | undefined): IpRule[] {
  if (!value) return [];
  const rules: IpRule[] = [];
  for (const raw of value.split(",")) {
    const entry = raw.trim();
    if (!entry) continue;
    const [ipPart, prefixPart, ...extra] = entry.split("/");
    const ip = parseIp(ipPart);
    if (!ip || extra.length > 0) {
      throw new IpAllowlistError(
        `Invalid ADMIN_IP_ALLOWLIST entry: "${entry}".`,
      );
    }
    // A mapped IPv6 address with a prefix keeps IPv6 semantics; reject it as
    // ambiguous rather than guess.
    if (prefixPart !== undefined && ipPart.includes(":") && ip.version === 4) {
      throw new IpAllowlistError(
        `Invalid ADMIN_IP_ALLOWLIST entry: "${entry}" (use plain IPv4 for ranges).`,
      );
    }
    const max = ip.version === 4 ? 32 : 128;
    let prefix = max;
    if (prefixPart !== undefined) {
      if (!/^\d{1,3}$/.test(prefixPart) || Number(prefixPart) > max) {
        throw new IpAllowlistError(
          `Invalid ADMIN_IP_ALLOWLIST entry: "${entry}".`,
        );
      }
      prefix = Number(prefixPart);
    }
    rules.push({ version: ip.version, addr: ip.addr, prefix });
  }
  return rules;
}

/** Empty rules → allowed. An unparseable IP with rules present → denied. */
export function isIpAllowed(ip: string, rules: IpRule[]): boolean {
  if (rules.length === 0) return true;
  const parsed = parseIp(ip);
  if (!parsed) return false;
  return rules.some((rule) => {
    if (rule.version !== parsed.version) return false;
    const mask = maskFor(rule.version, rule.prefix);
    return (parsed.addr & mask) === (rule.addr & mask);
  });
}

/** First `x-forwarded-for` hop, else `x-real-ip`, else null. */
export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() || null;
}
