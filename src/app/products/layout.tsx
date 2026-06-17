import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { normalizeProductImageUrl } from '@/lib/productImageUrl';

const SITE_URL = 'https://www.darshanstylehub.com';

export const metadata: Metadata = {
  title: 'Shop Suits & Co Ord Sets | Darshan Style Hub™ - Jaipur',
  description: 'Browse our collection of designer suits and co ord sets. Anarkali suits, salwar kameez, printed co ord sets, embroidered co ord sets. Free shipping on orders above ₹999.',
  openGraph: {
    title: 'Shop Suits & Co Ord Sets | Darshan Style Hub™',
    description: 'Browse designer suits and co ord sets. Free shipping on orders above ₹999.',
    url: 'https://www.darshanstylehub.com/products',
  },
};

export default async function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let itemListSchema = null;
  try {
    const products = await prisma.product.findMany({
      where: { inStock: true },
      select: { id: true, slug: true, name: true, price: true, images: { take: 1 } },
      orderBy: { featured: 'desc' },
      take: 50,
    });

    itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Designer Suits & Co Ord Sets',
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => {
        const img = p.images[0]
          ? normalizeProductImageUrl(p.images[0].url)
          : '/products/logo.jpeg';
        const imageUrl = img.startsWith('http') ? img : `${SITE_URL}${img.startsWith('/') ? '' : '/'}${img}`;
        return {
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/products/${p.slug || p.id}`,
          name: p.name.slice(0, 150),
          image: imageUrl,
        };
      }),
    };
  } catch {
    // DB unavailable — skip schema
  }

  return (
    <>
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      {children}
    </>
  );
}
