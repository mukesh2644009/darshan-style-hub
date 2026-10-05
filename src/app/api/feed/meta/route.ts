import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeProductImageUrl } from '@/lib/productImageUrl';

export const dynamic = 'force-dynamic';

const BASE = 'https://www.darshanstylehub.com';

// Meta requires specific condition values
function getCondition() {
  return 'new';
}

// Map category to Meta's product_type
function getProductType(category: string, subcategory: string): string {
  const parts = ['Apparel & Accessories', 'Clothing'];
  if (category) parts.push(category);
  if (subcategory) parts.push(subcategory);
  return parts.join(' > ');
}

// Map category to Google Product Category (used by Meta too)
function getGoogleCategory(category: string): string {
  switch (category.toLowerCase()) {
    case 'sarees': return 'Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing > Saris';
    case 'suits': return 'Apparel & Accessories > Clothing > Suits';
    case 'co ord sets': return 'Apparel & Accessories > Clothing > Outfits & Sets';
    case 'western dress': return 'Apparel & Accessories > Clothing > Dresses';
    case 'kurtis': return 'Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing';
    case 'tops': return 'Apparel & Accessories > Clothing > Shirts & Tops';
    default: return 'Apparel & Accessories > Clothing';
  }
}

// Meta only accepts full https image links; some photos are stored site-relative
// (e.g. /products/co-ord-sets/.../1.png).
function absoluteImage(url: string): string {
  const u = normalizeProductImageUrl(url);
  if (!u) return '';
  return encodeURI(/^https?:\/\//i.test(u) ? u : `${BASE}${u.startsWith('/') ? '' : '/'}${u}`);
}

// Colour for products saved without one: first colour word in the title.
const COLOUR_WORDS = ['off white', 'off-white', 'sea green', 'olive green', 'bottle green', 'sky blue', 'navy blue', 'royal blue', 'baby pink', 'hot pink',
  'black', 'white', 'cream', 'beige', 'ivory', 'red', 'maroon', 'wine', 'pink', 'peach', 'orange', 'rust', 'mustard', 'yellow', 'lemon',
  'green', 'mint', 'olive', 'teal', 'turquoise', 'blue', 'navy', 'purple', 'lavender', 'mauve', 'magenta', 'violet', 'brown', 'grey', 'gray', 'gold', 'silver', 'multi'];
function colourFromTitle(title: string): string {
  const t = title.toLowerCase();
  let best: { w: string; at: number } | null = null;
  for (const w of COLOUR_WORDS) {
    const at = t.search(new RegExp(`\\b${w}\\b`));
    if (at >= 0 && (!best || at < best.at || (at === best.at && w.length > best.w.length))) best = { w, at };
  }
  return best ? best.w.replace(/(^|[\s-])\w/g, (c) => c.toUpperCase()) : '';
}

// Escape CSV field
function csvField(value: string): string {
  const str = String(value ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { inStock: true, visibleOnSite: true },
      include: {
        images: { orderBy: { id: 'asc' }, take: 11 }, // upload order — front photo first
        sizes: true,
        colors: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Meta Commerce Manager CSV feed header
    const headers = [
      'id',
      'title',
      'description',
      'availability',
      'condition',
      'price',
      'link',
      'image_link',
      'additional_image_link',
      'brand',
      'google_product_category',
      'product_type',
      'sale_price',
      'item_group_id',
      'gender',
      'age_group',
      'color',
      'size',
      'inventory',
      'material',
      'pattern',
      'shipping',
    ];

    const rows: string[][] = [headers];

    for (const product of products) {
      // Primary image: prefer images relation, fall back to legacy image field
      const legacyImage = (product as unknown as { image?: string }).image;
      const primaryImage = absoluteImage(product.images[0]?.url || legacyImage || '');

      // Skip products with no image at all — Meta requires a valid image_link
      if (!primaryImage) continue;

      // UTM parameters on every catalog product URL so GA4 attributes
      // Meta Catalog Sales traffic as "facebook / paid_social" instead of referral.
      // Meta macros like {{site_source_name}} only resolve in ad-level tracking fields,
      // NOT in the product feed link. Use static "facebook" here — GA4 will correctly
      // attribute all Meta placements (fb + ig) as paid_social.
      const productUrl = `${BASE}/products/${product.slug || product.id}?utm_source=facebook&utm_medium=paid_social&utm_campaign=catalog_sales&utm_content=${encodeURIComponent(product.slug || product.id)}`;
      const additionalImages = product.images.slice(1, 11).map(i => absoluteImage(i.url)).filter(Boolean).join(',');

      // Clean description - strip newlines for CSV
      const description = product.description
        .replace(/\n+/g, ' ')
        .replace(/"/g, "'")
        .substring(0, 9999);

      // Sizes - if multiple, create one row per size; if saree use Free Size.
      // Stock per size, so Meta stops advertising a size that has sold out.
      const stock = new Map(product.sizes.map(s => [s.size, s.quantity]));
      const sizes = product.category === 'Sarees'
        ? ['Free Size']
        : product.sizes.length > 0
          ? product.sizes.map(s => s.size)
          : ['One Size'];
      const sizeQty = (size: string) =>
        stock.has(size) ? stock.get(size)! : product.sizes.reduce((n, s) => n + s.quantity, 0) || 1;

      // Meta: price = full price (MRP), sale_price = what the customer pays.
      const discounted = !!product.originalPrice && product.originalPrice > product.price;
      const fullPrice = discounted ? product.originalPrice! : product.price;

      // Colors
      const colors = product.colors.length > 0
        ? product.colors.map(c => c.name)
        : [colourFromTitle(product.name)];

      // For products with multiple sizes, create a row per size (Meta variant support)
      for (const size of sizes) {
        const variantId = sizes.length > 1
          ? `${product.id}_${size.replace(/\s+/g, '_')}`
          : product.id;

        const row = [
          variantId,                                          // id
          product.name,                                       // title
          description,                                        // description
          product.inStock && sizeQty(size) > 0 ? 'in stock' : 'out of stock', // availability
          getCondition(),                                     // condition
          `${fullPrice} INR`,                                // price (MRP)
          productUrl,                                         // link
          primaryImage,                                       // image_link
          additionalImages,                                   // additional_image_link
          'Darshan Style Hub',                                // brand
          getGoogleCategory(product.category),               // google_product_category
          getProductType(product.category, product.subcategory || ''), // product_type
          discounted ? `${product.price} INR` : '',          // sale_price (what the customer pays)
          product.id,                                         // item_group_id (groups variants)
          'female',                                           // gender
          'adult',                                            // age_group
          colors[0] || '',                                    // color
          size,                                               // size
          String(Math.max(0, sizeQty(size))),                 // inventory
          '',                                                 // material
          '',                                                 // pattern
          'IN:::0 INR',                                       // shipping (free in India above threshold)
        ];

        rows.push(row.map(csvField));
      }
    }

    const csv = rows.map(row => row.join(',')).join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Meta caches for 1 hour min
        'Content-Disposition': 'inline; filename="meta-product-feed.csv"',
      },
    });
  } catch (error) {
    console.error('Meta feed error:', error);
    return NextResponse.json({ error: 'Failed to generate feed' }, { status: 500 });
  }
}
