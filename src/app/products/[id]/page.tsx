import { notFound } from 'next/navigation';
import { getProductById, getRelatedProducts } from '@/lib/products';
import ProductDetailClient from './ProductDetailClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.darshanstylehub.com';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductById(params.id);
  
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

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
      url: `${SITE_URL}/products/${params.id}`,
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
  const product = await getProductById(params.id);
  
  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(params.id, product.category, 4);

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
      url: `${SITE_URL}/products/${params.id}`,
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
