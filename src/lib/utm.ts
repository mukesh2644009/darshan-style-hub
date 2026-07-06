/**
 * utm.ts — UTM capture, persistence, and retrieval
 *
 * How it works:
 *  1. On first page load, reads UTM params + fbclid from the URL
 *  2. Stores them in sessionStorage (persists across SPA navigation, not across tabs)
 *  3. Also stores in localStorage as a fallback for longer sessions
 *  4. `getUTMs()` always returns the last known UTMs for attaching to events
 *
 * Why sessionStorage + localStorage:
 *  - sessionStorage: survives client-side navigation within the same tab
 *  - localStorage: survives page reloads (important for Razorpay redirect flow)
 */

const SESSION_KEY = 'dsh_utms';
const LOCAL_KEY = 'dsh_utms_lc';

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  captured_at?: string;
}

/**
 * Set the _fbc cookie manually from fbclid URL param.
 * The Meta Pixel sets this automatically, but it may load after the first render.
 * Setting it here guarantees it exists for CAPI calls on product/checkout pages.
 * Format: fb.1.{timestamp}.{fbclid}
 */
function setFbcCookie(fbclid: string): void {
  try {
    const existing = document.cookie.split(';').find(c => c.trim().startsWith('_fbc='));
    if (existing) return; // already set by pixel — don't overwrite
    const ts = Date.now();
    document.cookie = `_fbc=fb.1.${ts}.${fbclid}; path=/; max-age=7776000; SameSite=Lax`;
  } catch {
    // ignore
  }
}

/** Read UTMs from the current URL and persist them. Call on every page load. */
export function captureUTMs(): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const utmKeys: (keyof UTMParams)[] = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid',
  ];

  const found: UTMParams = {};
  for (const key of utmKeys) {
    const val = params.get(key);
    if (val) found[key] = val;
  }

  // If fbclid is in the URL, set _fbc cookie immediately (before pixel loads)
  if (found.fbclid) {
    setFbcCookie(found.fbclid);
  }

  // Only overwrite stored UTMs if new ones are present in the URL
  if (Object.keys(found).length > 0) {
    found.captured_at = new Date().toISOString();
    const json = JSON.stringify(found);
    try {
      sessionStorage.setItem(SESSION_KEY, json);
      localStorage.setItem(LOCAL_KEY, json);
    } catch {
      // Storage might be blocked (private browsing, Safari ITP)
    }
  }
}

/** Retrieve the last captured UTMs. */
export function getUTMs(): UTMParams {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Clear stored UTMs (call after Purchase to avoid polluting future sessions). */
export function clearUTMs(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
    // Keep localStorage so we can attribute delayed conversions
  } catch {
    // ignore
  }
}

/**
 * Read Meta's _fbc and _fbp cookies.
 * These are required by Conversions API for high-quality event matching.
 *
 * _fbc  = click ID cookie (set when user arrives via a Facebook ad with fbclid)
 * _fbp  = browser ID cookie (set by the Meta Pixel on first load)
 */
export function getMetaCookies(): { fbc?: string; fbp?: string } {
  if (typeof document === 'undefined') return {};

  const cookies: Record<string, string> = {};
  document.cookie.split(';').forEach((c) => {
    const [k, v] = c.trim().split('=');
    if (k && v) cookies[k] = decodeURIComponent(v);
  });

  return {
    fbc: cookies['_fbc'],
    fbp: cookies['_fbp'],
  };
}
