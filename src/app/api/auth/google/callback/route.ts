import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { exchangeCodeForToken, fetchGoogleUserInfo, isGoogleConfigured } from '@/lib/google-oauth';

export const dynamic = 'force-dynamic';

/**
 * Google OAuth callback handler.
 * Flow:
 *  1. Validate `state` against the cookie (CSRF protection) and read the post-login redirect target.
 *  2. Exchange the `code` for an access token, then fetch the user's profile.
 *  3. Find-or-create the Darshan user:
 *     - by googleId  → existing google user, sign them in
 *     - else by email → link Google to the existing email account (sets googleId)
 *     - else create a fresh CUSTOMER user (random unguessable password hash)
 *  4. Create a session row + auth_token cookie, then redirect to the original destination
 *     (`/admin` for admins, `/my-orders` otherwise — same rules as email/phone login).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const errorParam = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // Read & clear the state cookie regardless of outcome
  const stateCookie = cookies().get('google_oauth_state')?.value;
  cookies().delete('google_oauth_state');

  function fail(message: string) {
    const params = new URLSearchParams({ error: 'google', message });
    return NextResponse.redirect(`${url.origin}/login?${params.toString()}`);
  }

  if (errorParam) {
    return fail(errorParam === 'access_denied' ? 'Google sign-in cancelled.' : `Google error: ${errorParam}`);
  }

  if (!isGoogleConfigured()) {
    return fail('Google sign-in is not configured.');
  }

  if (!code || !state) {
    return fail('Missing code or state from Google.');
  }

  if (!stateCookie) {
    return fail('Sign-in session expired. Please try again.');
  }

  let redirectTarget = '';
  try {
    const parsed = JSON.parse(stateCookie) as { state?: string; redirect?: string };
    if (!parsed.state || parsed.state !== state) {
      return fail('Invalid sign-in state. Please try again.');
    }
    redirectTarget = typeof parsed.redirect === 'string' ? parsed.redirect : '';
  } catch {
    return fail('Corrupted sign-in state. Please try again.');
  }

  // Exchange code for tokens, then fetch profile
  let profile;
  try {
    const tokenRes = await exchangeCodeForToken({ code, origin: url.origin });
    profile = await fetchGoogleUserInfo(tokenRes.access_token);
  } catch (e) {
    console.error('Google OAuth exchange failed:', e);
    return fail('Could not verify your Google account. Please try again.');
  }

  if (profile.email_verified === false) {
    return fail('Your Google email is not verified.');
  }

  const normalizedEmail = profile.email.toLowerCase().trim();
  const displayName = profile.name?.trim() || profile.given_name?.trim() || normalizedEmail.split('@')[0];

  // 1. Look up by googleId
  let user = await prisma.user.findUnique({ where: { googleId: profile.sub } });

  // 2. Else look up by email and link
  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: profile.sub,
          ...(byEmail.image ? {} : { image: profile.picture || null }),
          ...(byEmail.name ? {} : { name: displayName }),
        },
      });
    }
  }

  // 3. Else create
  if (!user) {
    const randomPassword = await hashPassword(crypto.randomUUID() + crypto.randomUUID());
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: displayName,
        googleId: profile.sub,
        image: profile.picture || null,
        password: randomPassword,
        role: 'CUSTOMER',
      },
    });

    // Fire-and-forget welcome + admin notification
    try {
      const { sendWelcomeEmail, sendNewSignupNotification } = await import('@/lib/email');
      sendWelcomeEmail({ to: user.email, customerName: user.name || 'Valued Customer' }).catch(() => {});
      sendNewSignupNotification({
        customerName: user.name || 'Unknown',
        customerEmail: user.email,
        customerPhone: user.phone,
      }).catch(() => {});
    } catch {}
  }

  // Create session
  await prisma.session.deleteMany({ where: { userId: user.id } });
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId: user.id, token: sessionToken, expiresAt },
  });

  // Decide where to send the user
  let dest = redirectTarget;
  if (!dest) dest = user.role === 'ADMIN' ? '/admin' : '/my-orders';
  // Don't allow open redirects — only same-origin paths
  if (!dest.startsWith('/')) dest = '/my-orders';
  // Block non-admins from being redirected to /admin
  if (dest.startsWith('/admin') && user.role !== 'ADMIN') dest = '/my-orders';

  const res = NextResponse.redirect(`${url.origin}${dest}`);
  res.cookies.set('auth_token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
  return res;
}
