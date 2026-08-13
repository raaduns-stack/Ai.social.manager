import { Request } from 'express';

/**
 * Extracts the real client IP from a request, accounting for common
 * reverse-proxy headers (X-Forwarded-For, X-Real-IP) before falling
 * back to the socket's remote address.
 */
export function extractIp(request: Request): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return first.trim();
  }

  const realIp = request.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return request.socket?.remoteAddress ?? 'unknown';
}
