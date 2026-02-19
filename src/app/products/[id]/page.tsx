import { notFound } from 'next/navigation';
import { getProductBySlugOrId, getRelatedProducts } from '@/lib/products';
import ProductDetailClient from './ProductDetailClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.darshanstylehub.com';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductBySlugOrId(params.id);
  
  if (!product) {
    return { title: 'Product Not Found' };
  }

  const title = `${product.name} | Darshan Style Hub - Designer Suits & Kurtis`;
  const description = product.description.length > 160 
    ? product.description.slice(0, 157) + '...' 
    : product.description;
  const imageUrl = product.images[0] 
    ? `${SITE_URL}${product.images[0].startsWith('/') ? '' : '/'}${product.images[0]}`
    : `${SITE_URL}/products/logo.jpeg`;

  const canonicalUrl = `${SITE_URL}/products/${product.slug || params.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      images: [imageUrl],
      url: canonicalUrl,
      siteName: 'Darshan Style Hub',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProductBySlugOrId(params.id);
  
  if (!product) {
    notFound();
  }

  // Redirect to SEO-friendly URL if user visited via old ID
  const slug = product.slug || params.id;
  if (product.slug && params.id !== product.slug) {
    const { redirect } = await import('next/navigation');
    redirect(`/products/${product.slug}`);
  }

  const relatedProducts = await getRelatedProducts(product.id, product.category, 4);
  const canonicalUrl = `${SITE_URL}/products/${product.slug || params.id}`;

  // Product schema for rich results in Google
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((img) => 
      `${SITE_URL}${img.startsWith('/') ? '' : '/'}${img}`
    ),
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Darshan Style Hub',
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'INR',
      price: product.price,
      availability: product.inStock 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    ...(product.rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviews,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
    </>
  );
}
