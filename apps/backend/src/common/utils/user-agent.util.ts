/**
 * Parses a raw User-Agent header string into a structured object.
 *
 * This is a lightweight built-in parser. For richer device/OS/browser
 * detection consider integrating the ua-parser-js or owser npm package.
 */
export interface ParsedUserAgent {
  raw: string;
  browser: string | null;
  os: string | null;
  device: string | null;
}

export function parseUserAgent(userAgent: string | undefined): ParsedUserAgent {
  const raw = userAgent ?? '';

  if (!raw) {
    return { raw, browser: null, os: null, device: null };
  }

  // --- OS detection ---
  let os: string | null = null;
  if (/windows/i.test(raw)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(raw)) os = 'macOS';
  else if (/android/i.test(raw)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(raw)) os = 'iOS';
  else if (/linux/i.test(raw)) os = 'Linux';

  // --- Browser detection (order matters) ---
  let browser: string | null = null;
  if (/edg\//i.test(raw)) browser = 'Edge';
  else if (/chrome/i.test(raw) && !/chromium/i.test(raw)) browser = 'Chrome';
  else if (/firefox/i.test(raw)) browser = 'Firefox';
  else if (/safari/i.test(raw) && !/chrome/i.test(raw)) browser = 'Safari';
  else if (/opr\//i.test(raw)) browser = 'Opera';
  else if (/msie|trident/i.test(raw)) browser = 'Internet Explorer';

  // --- Device type ---
  let device: string | null = 'Desktop';
  if (/mobile/i.test(raw)) device = 'Mobile';
  else if (/tablet|ipad/i.test(raw)) device = 'Tablet';

  return { raw, browser, os, device };
}
