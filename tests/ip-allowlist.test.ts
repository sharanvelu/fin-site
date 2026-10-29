import { describe, expect, it } from "vitest";
import {
  IpAllowlistError,
  clientIpFromHeaders,
  isIpAllowed,
  parseAllowlist,
} from "@/lib/ip-allowlist";

const allowed = (list: string, ip: string) =>
  isIpAllowed(ip, parseAllowlist(list));

describe("parseAllowlist / isIpAllowed", () => {
  it("empty or unset list allows everything", () => {
    expect(parseAllowlist(undefined)).toEqual([]);
    expect(parseAllowlist(" , ,")).toEqual([]);
    expect(allowed("", "203.0.113.9")).toBe(true);
  });

  it("matches exact IPv4", () => {
    expect(allowed("203.0.113.10", "203.0.113.10")).toBe(true);
    expect(allowed("203.0.113.10", "203.0.113.11")).toBe(false);
  });

  it("matches IPv4 CIDR ranges", () => {
    expect(allowed("10.0.0.0/8", "10.200.1.1")).toBe(true);
    expect(allowed("10.0.0.0/8", "11.0.0.1")).toBe(false);
    expect(allowed("192.168.1.0/24", "192.168.1.255")).toBe(true);
    expect(allowed("192.168.1.0/24", "192.168.2.1")).toBe(false);
    expect(allowed("0.0.0.0/0", "8.8.8.8")).toBe(true);
  });

  it("matches IPv6 addresses and ranges", () => {
    expect(allowed("2001:db8::1", "2001:db8:0:0:0:0:0:1")).toBe(true);
    expect(allowed("2001:db8::1", "2001:db8::2")).toBe(false);
    expect(allowed("2001:db8::/32", "2001:db8:abcd::1")).toBe(true);
    expect(allowed("2001:db8::/32", "2001:db9::1")).toBe(false);
    expect(allowed("::1/128", "::1")).toBe(true);
  });

  it("does not match across IP versions", () => {
    expect(allowed("10.0.0.0/8", "2001:db8::1")).toBe(false);
    expect(allowed("2001:db8::/32", "10.0.0.1")).toBe(false);
  });

  it("treats IPv4-mapped IPv6 clients as IPv4", () => {
    expect(allowed("10.0.0.0/8", "::ffff:10.1.2.3")).toBe(true);
    expect(allowed("10.0.0.0/8", "::ffff:11.1.2.3")).toBe(false);
    expect(allowed("::ffff:10.1.2.3", "10.1.2.3")).toBe(true);
  });

  it("handles mixed lists and whitespace", () => {
    const list = " 203.0.113.10 , 10.0.0.0/8,2001:db8::/32 ";
    expect(allowed(list, "203.0.113.10")).toBe(true);
    expect(allowed(list, "10.9.9.9")).toBe(true);
    expect(allowed(list, "2001:db8::5")).toBe(true);
    expect(allowed(list, "198.51.100.1")).toBe(false);
  });

  it("denies unparseable client IPs when a list is set", () => {
    expect(allowed("10.0.0.0/8", "not-an-ip")).toBe(false);
    expect(allowed("10.0.0.0/8", "")).toBe(false);
  });

  it("throws on invalid entries", () => {
    for (const bad of [
      "300.1.1.1",
      "10.0.0.0/33",
      "10.0.0.0/x",
      "10.0.0.0/8/9",
      "2001:db8::/129",
      "hello",
      "1.2.3",
    ]) {
      expect(() => parseAllowlist(bad), bad).toThrow(IpAllowlistError);
    }
  });
});

describe("clientIpFromHeaders", () => {
  it("prefers the first x-forwarded-for hop", () => {
    const h = new Headers({
      "x-forwarded-for": " 203.0.113.7 , 10.0.0.1",
      "x-real-ip": "10.0.0.9",
    });
    expect(clientIpFromHeaders(h)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then null", () => {
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "10.0.0.9" }))).toBe(
      "10.0.0.9",
    );
    expect(clientIpFromHeaders(new Headers())).toBeNull();
  });
});
