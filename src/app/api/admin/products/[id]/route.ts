import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

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
    // ✅ Require admin authentication
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { sku, name, description, price, originalPrice, category, subcategory, featured, newArrival, sizes } = body;

    // Validate required fields
    if (!sku || !name || !description || price === undefined) {
      return NextResponse.json(
        { error: 'SKU, name, description, and price are required' },
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

    // Update product basic info
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        sku,
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

    // Update size quantities if provided
    if (sizes && Array.isArray(sizes)) {
      for (const sizeData of sizes) {
        if (sizeData.id) {
          await prisma.productSize.update({
            where: { id: sizeData.id },
            data: { quantity: sizeData.quantity || 0 }
          });
        }
      }
    }

    // Refetch product with updated sizes
    const updatedProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        sizes: true,
        colors: true,
      },
    });

    return NextResponse.json({ success: true, product: updatedProduct });
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
    // Require admin authentication
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get product images before deleting
    const images = await prisma.productImage.findMany({
      where: { productId: params.id }
    });

    // Delete image files from filesystem
    for (const image of images) {
      try {
        // Image URLs are like /products/kurtis/kurti-1/1.jpg
        const imagePath = join(process.cwd(), 'public', image.url);
        await unlink(imagePath);
        console.log(`Deleted image: ${imagePath}`);
      } catch (fileError) {
        // Log but don't fail if file doesn't exist
        console.log(`Could not delete image file: ${image.url}`, fileError);
      }
    }

    // Delete related records
    await prisma.productImage.deleteMany({ where: { productId: params.id } });
    await prisma.productSize.deleteMany({ where: { productId: params.id } });
    await prisma.productColor.deleteMany({ where: { productId: params.id } });
    
    // Delete the product
    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, deletedImages: images.length });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
