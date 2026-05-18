import dns from "node:dns/promises";
import net from "node:net";

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  );
}

export function normalizeUrl(input: string): string {
  const url = new URL(input.trim());
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http/https URLs are allowed.");
  }

  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  return url.toString();
}

export async function assertPublicUrl(normalizedUrl: string): Promise<void> {
  const url = new URL(normalizedUrl);
  const host = url.hostname.toLowerCase();

  if (host === "localhost" || host.endsWith(".local")) {
    throw new Error("Local/internal hosts are not allowed.");
  }

  const directIpType = net.isIP(host);
  if (directIpType === 4 && isPrivateIpv4(host)) {
    throw new Error("Private IPv4 addresses are not allowed.");
  }
  if (directIpType === 6 && isPrivateIpv6(host)) {
    throw new Error("Private IPv6 addresses are not allowed.");
  }

  const records = await dns.lookup(host, { all: true, verbatim: true });
  if (!records.length) {
    throw new Error("Could not resolve host.");
  }

  for (const record of records) {
    if ((record.family === 4 && isPrivateIpv4(record.address)) || (record.family === 6 && isPrivateIpv6(record.address))) {
      throw new Error("Resolved host points to private/internal network.");
    }
  }
}
