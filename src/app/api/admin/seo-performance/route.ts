import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.darshanstylehub.com';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !key) {
    return NextResponse.json(
      { error: 'Google Search Console not configured. Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY to Vercel environment variables.' },
      { status: 500 }
    );
  }

  try {
    const { google } = await import('googleapis');
    const jwtClient = new google.auth.JWT(email, undefined, key, [
      'https://www.googleapis.com/auth/webmasters.readonly',
    ]);

    const searchConsole = google.searchconsole({ version: 'v1', auth: jwtClient });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '28');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const [pagesRes, queriesRes, summaryRes] = await Promise.all([
      // Top pages by clicks
      searchConsole.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ['page'],
          rowLimit: 25,
          orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
        },
      }),
      // Top queries
      searchConsole.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ['query'],
          rowLimit: 15,
          orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }],
        },
      }),
      // Overall summary
      searchConsole.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ['date'],
          rowLimit: days,
          orderBy: [{ fieldName: 'date', sortOrder: 'ASCENDING' }],
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
