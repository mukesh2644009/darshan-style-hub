import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const newArrival = searchParams.get('newArrival');
    const subcategory = searchParams.get('subcategory');
    const search = searchParams.get('search')?.trim();
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (subcategory) {
      where.subcategory = subcategory;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    if (newArrival === 'true') {
      where.newArrival = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { subcategory: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        images: true,
        sizes: true,
        colors: true,
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      ...(limit ? { take: limit } : {}),
    });

    // Transform to match expected format
    const transformedProducts = products.map(product => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      subcategory: product.subcategory,
      inStock: product.inStock,
      featured: product.featured,
      newArrival: product.newArrival,
      rating: product.rating,
      reviews: product.reviews,
      images: product.images.map(img => img.url),
      sizes: product.sizes.map(s => s.size),
      colors: product.colors.map(c => ({ name: c.name, hex: c.hex })),
      stock: product.sizes.reduce((sum, s) => sum + (s.quantity ?? 0), 0),
    }));

    return NextResponse.json({ success: true, products: transformedProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
