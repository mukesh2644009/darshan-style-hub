import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    // Require admin authentication
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get all product images before deleting
    const images = await prisma.productImage.findMany({});
    let deletedImagesCount = 0;

    // Delete image files from filesystem
    for (const image of images) {
      try {
        const imagePath = join(process.cwd(), 'public', image.url);
        await unlink(imagePath);
        deletedImagesCount++;
        console.log(`Deleted image: ${imagePath}`);
      } catch (fileError) {
        // Log but don't fail if file doesn't exist
        console.log(`Could not delete image file: ${image.url}`);
      }
    }

    // Delete all related records
    await prisma.productImage.deleteMany({});
    await prisma.productSize.deleteMany({});
    await prisma.productColor.deleteMany({});
    
    // Delete all products
    const result = await prisma.product.deleteMany({});

    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${result.count} products and ${deletedImagesCount} image files` 
    });
  } catch (error) {
    console.error('Error deleting all products:', error);
    return NextResponse.json(
      { error: 'Failed to delete products' },
      { status: 500 }
    );
  }
}
