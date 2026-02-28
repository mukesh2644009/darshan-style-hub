import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const category = (formData.get('category') as string) || 'co-ord-sets';
    const productFolder = (formData.get('productFolder') as string) || '';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    const categoryFolder = category.toLowerCase().replace(/\s+/g, '-');
    const folder = productFolder || `product-${Date.now()}`;
    const dirPath = path.join(process.cwd(), 'public', 'products', categoryFolder, folder);

    await mkdir(dirPath, { recursive: true });

    const uploadedPaths: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Max 5MB per image.` },
          { status: 400 }
        );
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${i + 1}.${ext}`;
      const filePath = path.join(dirPath, fileName);

      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));

      uploadedPaths.push(`/products/${categoryFolder}/${folder}/${fileName}`);
    }

    if (uploadedPaths.length === 0) {
      return NextResponse.json(
        { error: 'No valid image files found' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      images: uploadedPaths,
      folder: `products/${categoryFolder}/${folder}`,
      count: uploadedPaths.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload images';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
