// Where each site category is listed on Flipkart and Myntra — shown in the
// admin so it's clear which category to pick when uploading. Only confirmed
// values (real uploads or the user); '' = not set up yet. Client-safe.

export interface MarketplaceCategory {
  flipkart: string;
  myntra: string;
}

const CATEGORIES: Record<string, MarketplaceCategory> = {
  'Co Ord Sets': { flipkart: 'Co-ords (Apparel Set)', myntra: 'Co-Ords' },
  'Summer Co-ord Sets': { flipkart: 'Co-ords (Apparel Set)', myntra: 'Co-Ords' },
  Suits: { flipkart: 'Salwar Kurta Dupatta', myntra: 'Kurta Sets' },
  Kurtis: { flipkart: 'Ethnic Sets (kurta + bottom) / Kurta (single)', myntra: '' },
  Tops: { flipkart: 'Tops', myntra: '' },
  'Western Dress': { flipkart: 'Clothing → Formal Wear → Dress', myntra: 'Dresses' },
  Sarees: { flipkart: '', myntra: 'Sarees' },
};

export function marketplaceCategoryFor(siteCategory: string): MarketplaceCategory {
  return CATEGORIES[siteCategory] || { flipkart: '', myntra: '' };
}
