import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

const BASE = 'https://www.darshanstylehub.com';

const STATIC: MetadataRoute.Sitemap = [
  { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  { url: `${BASE}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/returns`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/shipping`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  { url: `${BASE}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const products = await prisma.product.findMany({
      select: { id: true, slug: true, updatedAt: true },
    });

    const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${BASE}/products/${p.slug || p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...STATIC, ...productEntries];
  } catch {
    return STATIC;
  }
}
