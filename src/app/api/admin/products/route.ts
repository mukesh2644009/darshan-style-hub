import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { 
      sku, 
      name, 
      description, 
      price, 
      originalPrice, 
      category, 
      subcategory, 
      featured, 
      newArrival,
      images,
      sizes,
      colors 
    } = body;

    // Validate required fields
    if (!sku || !name || !description || price === undefined || !category) {
      return NextResponse.json(
        { error: 'SKU, name, description, price, and category are required' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku }
    });

    if (existingSku) {
      return NextResponse.json(
        { error: 'SKU already exists. Please use a unique SKU.' },
        { status: 400 }
      );
    }

    // Validate price is positive
    if (price < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      );
    }

    // Create product with related data
    const product = await prisma.product.create({
      data: {
        sku,
        name,
        description,
        price: parseFloat(price.toString()),
        originalPrice: originalPrice ? parseFloat(originalPrice.toString()) : null,
        category,
        subcategory: subcategory || '',
        featured: Boolean(featured),
        newArrival: Boolean(newArrival),
        images: images && images.length > 0 ? {
          create: images.map((url: string) => ({ url }))
        } : undefined,
        sizes: sizes && sizes.length > 0 ? {
          create: sizes.map((s: { size: string; quantity: number } | string) => {
            if (typeof s === 'string') {
              return { size: s, quantity: 0 };
            }
            return { size: s.size, quantity: s.quantity || 0 };
          })
        } : undefined,
        colors: colors && colors.length > 0 ? {
          create: colors.map((color: { name: string; hex: string }) => ({ 
            name: color.name, 
            hex: color.hex 
          }))
        } : undefined,
      },
      include: {
        images: true,
        sizes: true,
        colors: true,
      },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
