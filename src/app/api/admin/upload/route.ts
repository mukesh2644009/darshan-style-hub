import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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

    const categoryFolder = category.toLowerCase();
    const folder = productFolder || `product-${Date.now()}`;
    const uploadDir = join(process.cwd(), 'public', 'products', categoryFolder, folder);

    await mkdir(uploadDir, { recursive: true });

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
      const filePath = join(uploadDir, fileName);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

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
      folder: `/products/${categoryFolder}/${folder}`,
      count: uploadedPaths.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}
