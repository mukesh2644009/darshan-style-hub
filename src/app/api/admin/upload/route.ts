import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { MAX_ADMIN_IMAGE_BYTES, MAX_ADMIN_IMAGE_MB } from '@/lib/uploadLimits';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const rawFolder = (formData.get('productFolder') as string) || '';
    // Safe folder name for all filesystems (avoid slashes, reserved names, path traversal)
    const safeFolder = rawFolder
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120);
    const productFolder = safeFolder || `product-${Date.now()}`;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    const categoryFolder = category.toLowerCase().replace(/\s+/g, '-');
    const folder = productFolder;
    const dirPath = path.join(process.cwd(), 'public', 'products', categoryFolder, folder);

    await mkdir(dirPath, { recursive: true });

    const uploadedPaths: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        continue;
      }

      if (file.size > MAX_ADMIN_IMAGE_BYTES) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Max ${MAX_ADMIN_IMAGE_MB}MB per image.` },
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
    const isReadOnlyFs = message.includes('ENOENT') || message.includes('EROFS') || message.includes('read-only');
    return NextResponse.json(
      { error: isReadOnlyFs
          ? 'Image upload is only available when running locally. Please upload images locally (npm run dev), then push to deploy.'
          : message
      },
      { status: isReadOnlyFs ? 400 : 500 }
    );
  }
}
