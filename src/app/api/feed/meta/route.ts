import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    default: return 'Apparel & Accessories > Clothing';
  }
}

// Escape CSV field
function csvField(value: string): string {
  const str = String(value ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { inStock: true },
      include: {
        images: { take: 5 },
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
      'material',
      'pattern',
      'shipping',
    ];

    const rows: string[][] = [headers];

    for (const product of products) {
      // Primary image: prefer images relation, fall back to legacy image field
      const legacyImage = (product as unknown as { image?: string }).image;
      const primaryImage = product.images[0]?.url || legacyImage || '';

      // Skip products with no image at all — Meta requires a valid image_link
      if (!primaryImage) continue;

      // UTM parameters on every catalog product URL so GA4 attributes
      // Meta Catalog Sales traffic as "facebook / paid_social" instead of referral.
      // Meta macros like {{site_source_name}} only resolve in ad-level tracking fields,
      // NOT in the product feed link. Use static "facebook" here — GA4 will correctly
      // attribute all Meta placements (fb + ig) as paid_social.
      const productUrl = `${BASE}/products/${product.slug || product.id}?utm_source=facebook&utm_medium=paid_social&utm_campaign=catalog_sales&utm_content=${encodeURIComponent(product.slug || product.id)}`;
      const additionalImages = product.images.slice(1, 5).map(i => i.url).join(',');

      // Clean description - strip newlines for CSV
      const description = product.description
        .replace(/\n+/g, ' ')
        .replace(/"/g, "'")
        .substring(0, 9999);

      // Sizes - if multiple, create one row per size; if saree use Free Size
      const sizes = product.category === 'Sarees'
        ? ['Free Size']
        : product.sizes.length > 0
          ? product.sizes.map(s => s.size)
          : ['One Size'];

      // Colors
      const colors = product.colors.length > 0
        ? product.colors.map(c => c.name)
        : [''];

      // For products with multiple sizes, create a row per size (Meta variant support)
      for (const size of sizes) {
        const variantId = sizes.length > 1
          ? `${product.id}_${size.replace(/\s+/g, '_')}`
          : product.id;

        const row = [
          variantId,                                          // id
          product.name,                                       // title
          description,                                        // description
          product.inStock ? 'in stock' : 'out of stock',     // availability
          getCondition(),                                     // condition
          `${product.price} INR`,                            // price
          productUrl,                                         // link
          primaryImage,                                       // image_link
          additionalImages,                                   // additional_image_link
          'Darshan Style Hub',                                // brand
          getGoogleCategory(product.category),               // google_product_category
          getProductType(product.category, product.subcategory || ''), // product_type
          product.originalPrice ? `${product.originalPrice} INR` : '', // sale_price (original = MRP, price = sale)
          product.id,                                         // item_group_id (groups variants)
          'female',                                           // gender
          'adult',                                            // age_group
          colors[0] || '',                                    // color
          size,                                               // size
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
