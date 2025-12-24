import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const newArrival = searchParams.get('newArrival');
    const subcategory = searchParams.get('subcategory');

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

    const products = await prisma.product.findMany({
      where,
      include: {
        images: true,
        sizes: true,
        colors: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to match expected format
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      subcategory: product.subcategory,
      featured: product.featured,
      newArrival: product.newArrival,
      rating: product.rating,
      reviews: product.reviews,
      images: product.images.map(img => img.url),
      sizes: product.sizes.map(s => s.size),
      colors: product.colors.map(c => ({ name: c.name, hex: c.hex })),
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
