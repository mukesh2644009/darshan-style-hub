import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeProductImageUrl } from '@/lib/productImageUrl';

const SITE_URL = 'https://www.darshanstylehub.com';
const STORE_NAME = 'Darshan Style Hub';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildAbsoluteImageUrl(img: string): string {
  if (img.startsWith('http')) return img;
  return `${SITE_URL}${img.startsWith('/') ? '' : '/'}${img}`;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { inStock: true },
      include: {
        images: true,
        sizes: true,
        colors: true,
      },
    });

    const items = products.map((p) => {
      const imageUrl = p.images[0]
        ? buildAbsoluteImageUrl(normalizeProductImageUrl(p.images[0].url))
        : `${SITE_URL}/products/logo.jpeg`;

      const additionalImages = p.images.slice(1, 10).map((img) =>
        buildAbsoluteImageUrl(normalizeProductImageUrl(img.url))
      );

      const slug = p.slug || p.id;
      const productUrl = `${SITE_URL}/products/${slug}`;
      const description = stripHtml(p.description).slice(0, 5000);
      const availability = p.inStock ? 'in_stock' : 'out_of_stock';
      const condition = 'new';

      const salePrice = p.originalPrice && p.originalPrice > p.price
        ? `<g:sale_price>${p.price.toFixed(2)} INR</g:sale_price>\n`
        : '';
      const price = p.originalPrice && p.originalPrice > p.price
        ? p.originalPrice
        : p.price;

      const sizes = p.sizes
        .filter((s) => s.quantity > 0)
        .map((s) => s.size)
        .join('/');

      return `    <item>
      <g:id>${escapeXml(p.sku || p.id)}</g:id>
      <g:title>${escapeXml(p.name.slice(0, 150))}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
${additionalImages.map((img) => `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join('\n')}
      <g:availability>${availability}</g:availability>
      <g:price>${price.toFixed(2)} INR</g:price>
      ${salePrice}<g:condition>${condition}</g:condition>
      <g:brand>${escapeXml(STORE_NAME)}</g:brand>
      <g:mpn>${escapeXml(p.sku || p.id)}</g:mpn>
      <g:product_type>${escapeXml(p.category)}${p.subcategory ? ` > ${escapeXml(p.subcategory)}` : ''}</g:product_type>
      <g:google_product_category>2271</g:google_product_category>
${sizes ? `      <g:size>${escapeXml(sizes)}</g:size>\n` : ''}      <g:gender>female</g:gender>
      <g:age_group>adult</g:age_group>
      <g:shipping>
        <g:country>IN</g:country>
        <g:price>0.00 INR</g:price>
      </g:shipping>
    </item>`;
    });

    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(STORE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>Designer Suits and Co Ord Sets from ${escapeXml(STORE_NAME)}, Jaipur</description>
${items.join('\n')}
  </channel>
</rss>`;

    return new NextResponse(feed, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Google Shopping feed error:', error);
    return NextResponse.json({ error: 'Feed generation failed' }, { status: 500 });
  }
}
