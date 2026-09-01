const SITE_URL = 'https://www.darshanstylehub.com';

export interface ProductSearchRow {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * Top product pages by Google organic search clicks (last `days` days).
 * Returns [] if Search Console isn't configured or the API call fails —
 * callers should treat this as an optional enhancement, never a hard dependency.
 */
export async function getTopProductPagesFromSearchConsole(days = 28, limit = 8): Promise<ProductSearchRow[]> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return [];

  try {
    const { google } = await import('googleapis');

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const searchConsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const res = await searchConsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: fmt(startDate),
        endDate: fmt(endDate),
        dimensions: ['page'],
        dimensionFilterGroups: [
          { filters: [{ dimension: 'page', operator: 'contains', expression: '/products/' }] },
        ],
        rowLimit: limit,
      },
    });

    return (res.data.rows || []).map(r => ({
      url: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    }));
  } catch (err) {
    console.error('[searchConsole] getTopProductPagesFromSearchConsole failed:', err);
    return [];
  }
}

/** Pulls the slug-or-id path segment out of a /products/<slugOrId> Search Console URL. */
export function extractProductKeyFromUrl(url: string): string | null {
  const match = url.match(/\/products\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
