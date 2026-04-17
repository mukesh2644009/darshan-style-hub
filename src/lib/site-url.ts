/** Production origin — use in WhatsApp/SMS/chat prefills so the real domain always appears (never *.vercel.app). */
export const CANONICAL_SITE_URL = 'https://www.darshanstylehub.com';

/**
 * Resolves the public site URL. Legacy / preview hosts (e.g. *.vercel.app) are not used in
 * customer-facing links so WhatsApp and email always reference the real domain.
 * Set NEXT_PUBLIC_SITE_URL to your production URL (e.g. https://www.darshanstylehub.com).
 */
function resolvePublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return CANONICAL_SITE_URL;
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const host = url.hostname.toLowerCase();
    if (host.endsWith('vercel.app') || host.includes('darshan-style-hub')) {
      return CANONICAL_SITE_URL;
    }
    return url.origin;
  } catch {
    return CANONICAL_SITE_URL;
  }
}

export const PUBLIC_SITE_URL = resolvePublicSiteUrl();
