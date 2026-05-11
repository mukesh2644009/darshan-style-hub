/**
 * Tiny Google OAuth 2.0 client — no extra deps, just fetch.
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID       (from Google Cloud Console → Credentials → OAuth client)
 *   GOOGLE_CLIENT_SECRET
 *
 * The redirect URI used here is `${origin}/api/auth/google/callback` and must be
 * added to the OAuth client's "Authorized redirect URIs" list. Add both
 * https://your-prod-domain/api/auth/google/callback AND http://localhost:3333/api/auth/google/callback.
 */

const AUTH_URL  = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USER_URL  = 'https://www.googleapis.com/oauth2/v3/userinfo';

export function isGoogleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleRedirectUri(origin: string): string {
  // Strip trailing slash defensively
  return `${origin.replace(/\/$/, '')}/api/auth/google/callback`;
}

export function buildGoogleAuthUrl(opts: { origin: string; state: string }): string {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID is not set');
  }
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: getGoogleRedirectUri(opts.origin),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    include_granted_scopes: 'true',
    state: opts.state,
    prompt: 'select_account',
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

export async function exchangeCodeForToken(opts: {
  code: string;
  origin: string;
}): Promise<GoogleTokenResponse> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials are not configured');
  }
  const body = new URLSearchParams({
    code: opts.code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: getGoogleRedirectUri(opts.origin),
    grant_type: 'authorization_code',
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google token exchange failed (${res.status}): ${text}`);
  }
  return (await res.json()) as GoogleTokenResponse;
}

export interface GoogleUserInfo {
  sub: string;       // Google user id
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch Google userinfo (${res.status}): ${text}`);
  }
  const data = (await res.json()) as GoogleUserInfo;
  if (!data.sub || !data.email) {
    throw new Error('Google userinfo response missing sub or email');
  }
  return data;
}
