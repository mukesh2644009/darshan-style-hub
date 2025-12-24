import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        sizes: true,
        colors: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, price, originalPrice, category, subcategory, featured, newArrival } = body;

    // Validate required fields
    if (!name || !description || price === undefined) {
      return NextResponse.json(
        { error: 'Name, description, and price are required' },
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

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        description,
        price: parseFloat(price.toString()),
        originalPrice: originalPrice ? parseFloat(originalPrice.toString()) : null,
        category,
        subcategory,
        featured: Boolean(featured),
        newArrival: Boolean(newArrival),
      },
      include: {
        images: true,
        sizes: true,
        colors: true,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Delete related records first
    await prisma.productImage.deleteMany({ where: { productId: params.id } });
    await prisma.productSize.deleteMany({ where: { productId: params.id } });
    await prisma.productColor.deleteMany({ where: { productId: params.id } });
    
    // Delete the product
    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

