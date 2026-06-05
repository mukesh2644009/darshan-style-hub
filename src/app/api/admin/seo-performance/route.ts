import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.darshanstylehub.com';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return NextResponse.json(
      { error: 'Google Search Console not configured. Add GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET and GOOGLE_OAUTH_REFRESH_TOKEN to Vercel environment variables.' },
      { status: 500 }
    );
  }

  try {
    const { google } = await import('googleapis');

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const searchConsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '28');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const [pagesRes, queriesRes, summaryRes] = await Promise.all([
      searchConsole.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ['page'],
          rowLimit: 25,
        },
      }),
      searchConsole.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ['query'],
          rowLimit: 15,
        },
      }),
      searchConsole.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ['date'],
          rowLimit: days,
        },
      }),
    ]);

    return NextResponse.json({
      pages: pagesRes.data.rows || [],
      queries: queriesRes.data.rows || [],
      daily: summaryRes.data.rows || [],
      period: { startDate: fmt(startDate), endDate: fmt(endDate), days },
    });
  } catch (err) {
    console.error('Search Console API error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Search Console API error: ${msg}` }, { status: 500 });
  }
}
