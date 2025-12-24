import { notFound } from 'next/navigation';
import { getProductById, getRelatedProducts } from '@/lib/products';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProductById(params.id);
  
  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(params.id, product.category, 4);

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
