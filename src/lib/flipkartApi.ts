// Minimal Flipkart Seller API client (Self Access Application).
// Token: starts from FLIPKART_ACCESS_TOKEN; on a 401 it mints a fresh one from
// FLIPKART_APP_ID / FLIPKART_APP_SECRET (client_credentials, ~60 day life)
// and keeps it in memory for the rest of the server's lifetime.

const API_BASE = 'https://api.flipkart.net/sellers';
const MAX_SKUS_PER_CALL = 10; // API rejects more with error code 3000

let cachedToken: string | undefined = process.env.FLIPKART_ACCESS_TOKEN;

async function mintToken(): Promise<string> {
  const id = process.env.FLIPKART_APP_ID;
  const secret = process.env.FLIPKART_APP_SECRET;
  if (!id || !secret) throw new Error('FLIPKART_APP_ID / FLIPKART_APP_SECRET not set');
  const res = await fetch(
    'https://api.flipkart.net/oauth-service/oauth/token?grant_type=client_credentials&scope=Seller_Api',
    { headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}` } }
  );
  if (!res.ok) throw new Error(`Flipkart token request failed (${res.status})`);
  const data = await res.json();
  cachedToken = data.access_token as string;
  return cachedToken;
}

async function flipkartGet(path: string): Promise<Response> {
  const token = cachedToken ?? (await mintToken());
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (res.status !== 401) return res;
  const fresh = await mintToken();
  return fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${fresh}` }, cache: 'no-store' });
}

async function flipkartPost(path: string, body: unknown): Promise<Response> {
  const send = (token: string) => fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const res = await send(cachedToken ?? (await mintToken()));
  return res.status === 401 ? send(await mintToken()) : res;
}

export interface FlipkartListing {
  sku: string;
  listingStatus: string; // ACTIVE / INACTIVE / ...
  productUrl: string;
  productId: string;
  mrp: number;
  sellingPrice: number;
}

interface RawListing {
  listing_status: string;
  product_url: string;
  product_id: string;
  price?: { mrp?: number; selling_price?: number };
}

// Looks up our seller SKUs; SKUs Flipkart doesn't know are simply absent.
export async function fetchFlipkartListings(skus: string[]): Promise<FlipkartListing[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < skus.length; i += MAX_SKUS_PER_CALL) chunks.push(skus.slice(i, i + MAX_SKUS_PER_CALL));

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const res = await flipkartGet(`/listings/v3/${chunk.map(encodeURIComponent).join(',')}`);
      if (!res.ok) throw new Error(`Flipkart listings lookup failed (${res.status})`);
      const data = await res.json();
      return Object.entries((data.available ?? {}) as Record<string, RawListing>)
        .map(([sku, l]) => ({
          sku,
          listingStatus: l.listing_status,
          productUrl: l.product_url,
          productId: l.product_id,
          mrp: l.price?.mrp ?? 0,
          sellingPrice: l.price?.selling_price ?? 0,
        }));
    })
  );
  return results.flat();
}

export interface PriceUpdate {
  sku: string;
  productId: string; // FSN — required by Flipkart for every update
  mrp: number;
  sellingPrice: number;
}

// Updates prices on live listings. Flipkart answers per SKU, so one bad SKU
// doesn't fail the rest; returns the failures (empty = all succeeded).
export async function updateFlipkartPrices(updates: PriceUpdate[]): Promise<{ sku: string; error: string }[]> {
  const failures: { sku: string; error: string }[] = [];
  for (let i = 0; i < updates.length; i += MAX_SKUS_PER_CALL) {
    const chunk = updates.slice(i, i + MAX_SKUS_PER_CALL);
    const body = Object.fromEntries(chunk.map((u) => [
      u.sku,
      { product_id: u.productId, price: { mrp: u.mrp, selling_price: u.sellingPrice, currency: 'INR' } },
    ]));
    const res = await flipkartPost('/listings/v3/update/price', body);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      chunk.forEach((u) => failures.push({ sku: u.sku, error: `HTTP ${res.status}` }));
      continue;
    }
    for (const u of chunk) {
      const result = data[u.sku] as { status?: string; errors?: { description?: string }[] } | undefined;
      if (result?.status !== 'SUCCESS') {
        failures.push({ sku: u.sku, error: result?.errors?.map((e) => e.description).join('; ') || 'No response for this SKU' });
      }
    }
  }
  return failures;
}
