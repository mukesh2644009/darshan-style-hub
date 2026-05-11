import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { buildGoogleAuthUrl, isGoogleConfigured } from '@/lib/google-oauth';

export const dynamic = 'force-dynamic';

/**
 * Start the Google OAuth flow.
 *  - Generates a one-time `state` token (stored in a short-lived httpOnly cookie) for CSRF protection.
 *  - Optionally captures `?redirect=/checkout` so we send the user there after callback.
 *  - Redirects the browser to Google's consent screen.
 */
export async function GET(request: Request) {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Google sign-in is not configured. Please contact the site admin.' },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const redirectTarget = url.searchParams.get('redirect') || '';

  // Use the request's own origin so this works in dev (localhost:3333) and prod alike.
  const origin = url.origin;

  // CSRF state — cryptographically random
  const state = crypto.randomBytes(24).toString('hex');

  // Persist state + redirect target in a single short-lived cookie
  const statePayload = JSON.stringify({ state, redirect: redirectTarget }).slice(0, 1024);

  const authUrl = buildGoogleAuthUrl({ origin, state });
  const res = NextResponse.redirect(authUrl);

  res.cookies.set('google_oauth_state', statePayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60, // 10 minutes — plenty of time to finish consent
  });

  // Touch cookies() so Next correctly streams the Set-Cookie header back
  cookies();
  return res;
}
