import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const BASE = 'https://www.darshanstylehub.com';
const GRAPH_API = 'https://graph.facebook.com/v19.0';

function getGoogleCategory(category: string): string {
  switch (category.toLowerCase()) {
    case 'sarees': return 'Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing > Saris';
    case 'suits': return 'Apparel & Accessories > Clothing > Suits';
    case 'co ord sets': return 'Apparel & Accessories > Clothing > Outfits & Sets';
    default: return 'Apparel & Accessories > Clothing';
  }
}

export async function POST() {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const catalogId = process.env.FACEBOOK_CATALOG_ID;
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!catalogId || !accessToken) {
      return NextResponse.json({
        error: 'Missing FACEBOOK_CATALOG_ID or FACEBOOK_ACCESS_TOKEN in environment variables',
      }, { status: 500 });
    }

    const products = await prisma.product.findMany({
      include: { images: { take: 5 }, sizes: true, colors: true },
      orderBy: { createdAt: 'desc' },
    });

    // Meta allows max 1000 items per batch request
    const BATCH_SIZE = 999;
    const requests: object[] = [];

    for (const product of products) {
      const productUrl = `${BASE}/products/${product.slug || product.id}`;
      const primaryImage = product.images[0]?.url || '';
      const additionalImages = product.images.slice(1, 5).map(i => i.url);

      const description = product.description
        .replace(/\n+/g, ' ')
        .substring(0, 9999);

      const sizes = product.category === 'Sarees'
        ? ['Free Size']
        : product.sizes.length > 0
          ? product.sizes.map(s => s.size)
          : ['One Size'];

      const colorName = product.colors[0]?.name || '';

      for (const size of sizes) {
        const variantId = sizes.length > 1
          ? `${product.id}_${size.replace(/\s+/g, '_')}`
          : product.id;

        const itemData: Record<string, unknown> = {
          title: product.name,
          description,
          availability: product.inStock ? 'in stock' : 'out of stock',
          condition: 'new',
          price: `${product.price} INR`,
          link: productUrl,
          image_link: primaryImage,
          brand: 'Darshan Style Hub',
          google_product_category: getGoogleCategory(product.category),
          item_group_id: product.id,
          gender: 'female',
          age_group: 'adult',
          size,
          currency: 'INR',
        };

        if (product.originalPrice && product.originalPrice > product.price) {
          itemData.sale_price = `${product.price} INR`;
          itemData.price = `${product.originalPrice} INR`;
        }

        if (colorName) itemData.color = colorName;
        if (additionalImages.length > 0) {
          itemData.additional_image_link = additionalImages.join(',');
        }

        requests.push({
          method: 'UPSERT',
          retailer_id: variantId,
          data: itemData,
        });
      }
    }

    // Send in batches of 999
    const batches: object[][] = [];
    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      batches.push(requests.slice(i, i + BATCH_SIZE));
    }

    let totalUpserted = 0;
    const errors: string[] = [];

    for (const batch of batches) {
      const res = await fetch(`${GRAPH_API}/${catalogId}/items_batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allow_upsert: true,
          requests: batch,
          access_token: accessToken,
        }),
      });

      const data = await res.json() as { handles?: string[]; error?: { message: string } };

      if (!res.ok || data.error) {
        errors.push(data.error?.message || `Batch failed with status ${res.status}`);
      } else {
        totalUpserted += batch.length;
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      totalProducts: products.length,
      totalVariants: requests.length,
      totalUpserted,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length === 0
        ? `✅ Successfully synced ${totalUpserted} product variants to Meta catalog`
        : `⚠️ Synced ${totalUpserted} items but got ${errors.length} error(s)`,
    });
  } catch (error) {
    console.error('Meta catalog sync error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Sync failed' }, { status: 500 });
  }
}
