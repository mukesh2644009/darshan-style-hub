// Marketplace prices differ from the site's: Flipkart/Myntra charge platform
// fees, so their selling price = site price + a flat markup. Flipkart's MRP
// (the crossed-out "actual" price) is set a fixed % above that selling price
// so every listing shows a discount (business rules, 2026-09-30). The site's
// own prices never change.

export type Platform = 'flipkart' | 'myntra';

interface PricingRule {
  markup: number; // ₹ added to the site price
  // MRP = selling price + this %. When unset, the site MRP is kept and the
  // price is capped at it instead.
  mrpAbovePricePercent?: number;
}

export const PLATFORM_PRICING: Record<Platform, PricingRule> = {
  flipkart: { markup: 250, mrpAbovePricePercent: 30 },
  myntra: { markup: 200 },
};

export function markupLabel(platform: Platform): string {
  const rule = PLATFORM_PRICING[platform];
  return `+₹${rule.markup}` + (rule.mrpAbovePricePercent ? `, MRP +${rule.mrpAbovePricePercent}%` : '');
}

// Round up to the next price ending in 9 (1293 -> 1299, 1299 -> 1299).
const roundUpTo9 = (n: number) => Math.ceil((n + 1) / 10) * 10 - 1;

export interface PlatformPrice {
  price: number;
  mrp: number;
  // Only when the site MRP is kept: the markup would have pushed the price
  // above it, so the price was capped at MRP.
  capped: boolean;
}

export function platformPrice(
  product: { price: number; originalPrice: number | null },
  platform: Platform
): PlatformPrice {
  const rule = PLATFORM_PRICING[platform];
  const marked = roundUpTo9(product.price + rule.markup);
  if (rule.mrpAbovePricePercent) {
    return { price: marked, mrp: roundUpTo9(Math.round(marked * (1 + rule.mrpAbovePricePercent / 100))), capped: false };
  }
  // No site MRP means no tag price to respect — the marked-up price is the MRP.
  const mrp = product.originalPrice ?? marked;
  return { price: Math.min(marked, mrp), mrp, capped: marked > mrp };
}
