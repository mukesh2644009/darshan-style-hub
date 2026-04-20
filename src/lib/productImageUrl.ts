/**
 * Image URLs saved while developing sometimes include http://localhost:PORT or 127.0.0.1.
 * Those break on production (browser requests the shopper's machine). Strip to a site-relative path.
 */
export function normalizeProductImageUrl(url: string | null | undefined): string {
  if (url == null || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  try {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(trimmed)) {
      const u = new URL(trimmed);
      return `${u.pathname}${u.search || ''}`;
    }
  } catch {
    // fall through
  }
  return trimmed;
}
