/**
 * Lightweight IP geolocation using the ip-api.com free JSON endpoint.
 *
 * Why ip-api.com:
 *  - No API key or registration required for the free tier.
 *  - Returns a structured JSON response with city, region, country.
 *  - Returns status:"fail" for private/localhost IPs rather than erroring.
 *  - Free tier allows up to 45 requests/minute from a server IP.
 *
 * Behaviour:
 *  - Private / loopback IPs (127.x, ::1, 10.x, 192.168.x, etc.) return null
 *    immediately without making a network call.
 *  - Any network error or non-"success" response also returns null — location
 *    fields being null is acceptable and must never break the auth flow.
 *  - A 3-second timeout prevents a slow GeoIP response from delaying login.
 */

export interface GeoLocation {
  country: string | null;
  city: string | null;
  region: string | null;
}

/** Regex covering all RFC-1918 / loopback / link-local IPv4 + IPv6 loopback. */
const PRIVATE_IP_RE =
  /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$|fc|fd|fe80)/i;

function isPrivateOrLocalhost(ip: string): boolean {
  return !ip || ip === 'unknown' || PRIVATE_IP_RE.test(ip.trim());
}

export async function resolveGeoLocation(ip: string): Promise<GeoLocation> {
  const NULL_GEO: GeoLocation = { country: null, city: null, region: null };

  // Never make a network call for private / loopback addresses
  if (isPrivateOrLocalhost(ip)) {
    return NULL_GEO;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

    // Fields: status,country,regionName,city  (minimal payload)
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NULL_GEO;
    }

    const data = (await res.json()) as {
      status: string;
      country?: string;
      regionName?: string;
      city?: string;
    };

    if (data.status !== 'success') {
      // ip-api returns status:"fail" for private IPs, reserved ranges, etc.
      return NULL_GEO;
    }

    return {
      country: data.country ?? null,
      region: data.regionName ?? null,
      city: data.city ?? null,
    };
  } catch {
    // Swallow all errors (timeout, network failure, parse error).
    // null geo fields are acceptable — this must never break auth.
    return NULL_GEO;
  }
}
