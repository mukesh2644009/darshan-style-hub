// Client-safe Flipkart template helpers (no server-only imports), shared by
// the admin products table and the server-side export/fill routes.

export function isKurtaSet(productName: string): boolean {
  return /\bset\b|palazzo|\bpant\b/i.test(productName);
}

// "Kurtis" splits into two real, different Flipkart templates depending on the
// product itself (see isKurtaSet) — everything else is one template per category.
export function templateKeyFor(product: { category: string; name: string }): string {
  if (product.category === 'Kurtis') return isKurtaSet(product.name) ? 'Kurtis:set' : 'Kurtis:single';
  return product.category;
}

// Seller Hub's bulk-listing vertical ids, read off Seller Hub's own URLs
// (2026-09-30). Opening the link in a fresh tab lands directly on the
// "Download template" step with vertical + brand preselected.
const BULK_VERTICALS: Record<string, { vertical: string; vid: number; label: string }> = {
  Suits: { vertical: 'salwar_kurta_dupatta', vid: 1598, label: 'Salwar Kurta Dupatta' },
  'Kurtis:set': { vertical: 'ethnic_set', vid: 1584, label: 'Ethnic Sets' },
  'Kurtis:single': { vertical: 'kurta', vid: 1592, label: 'Kurta' },
  Tops: { vertical: 'top', vid: 4786, label: 'Tops' },
  'Co Ord Sets': { vertical: 'apparel_set', vid: 7481, label: 'Co-ords' },
  'Summer Co-ord Sets': { vertical: 'apparel_set', vid: 7481, label: 'Co-ords' },
  'Western Dress': { vertical: 'dress', vid: 4759, label: 'Dress' },
};

const SELLER_HUB_BRAND = 'Darshan Style Hub';

export function flipkartTemplateLink(templateKey: string): { url: string; label: string } | null {
  const v = BULK_VERTICALS[templateKey];
  if (!v) return null;
  const params = `brand=${encodeURIComponent(SELLER_HUB_BRAND)}&vertical=${v.vertical}&vid=${v.vid}`;
  return { url: `https://seller.flipkart.com/index.html#dashboard/addListings/bulk?${params}`, label: v.label };
}
