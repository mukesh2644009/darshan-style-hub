import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { MAX_ADMIN_IMAGE_BYTES, MAX_ADMIN_IMAGE_MB } from '@/lib/uploadLimits';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// On Vercel (production): upload to Cloudinary
// On local dev: save to public/products/ as before
const IS_VERCEL = !!process.env.VERCEL;

async function uploadToCloudinary(buffer: Buffer, folder: string, fileName: string): Promise<string> {
  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise((resolve, reject) => {
    const publicId = `darshan/${folder}/${fileName.replace(/\.[^.]+$/, '')}`;
    cloudinary.uploader.upload_stream(
      { public_id: publicId, overwrite: true, resource_type: 'image' },
      (err, result) => {
        if (err || !result) return reject(err || new Error('Cloudinary upload failed'));
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Check Cloudinary config if on Vercel
    if (IS_VERCEL) {
      const missing = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
        .filter(k => !process.env[k]);
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Cloudinary not configured. Missing env vars: ${missing.join(', ')}. Add them in Vercel → Settings → Environment Variables.` },
          { status: 500 }
        );
      }
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const category = (formData.get('category') as string) || 'co-ord-sets';
    const rawFolder = (formData.get('productFolder') as string) || '';
    const safeFolder = rawFolder
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120);
    const productFolder = safeFolder || `product-${Date.now()}`;
    const categoryFolder = category.toLowerCase().replace(/\s+/g, '-');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadedPaths: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      if (file.size > MAX_ADMIN_IMAGE_BYTES) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Max ${MAX_ADMIN_IMAGE_MB}MB per image.` },
          { status: 400 }
        );
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${i + 1}.${ext}`;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (IS_VERCEL) {
        // Production: upload to Cloudinary
        const url = await uploadToCloudinary(buffer, `${categoryFolder}/${productFolder}`, fileName);
        uploadedPaths.push(url);
      } else {
        // Local dev: save to public/products/
        const { writeFile, mkdir } = await import('fs/promises');
        const dirPath = path.join(process.cwd(), 'public', 'products', categoryFolder, productFolder);
        await mkdir(dirPath, { recursive: true });
        await writeFile(path.join(dirPath, fileName), buffer);
        uploadedPaths.push(`/products/${categoryFolder}/${productFolder}/${fileName}`);
      }
    }

    if (uploadedPaths.length === 0) {
      return NextResponse.json({ error: 'No valid image files found' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      images: uploadedPaths,
      folder: `products/${categoryFolder}/${productFolder}`,
      count: uploadedPaths.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload images';
    const detail = error instanceof Error ? error.stack : String(error);
    return NextResponse.json({ error: message, detail }, { status: 500 });
  }
}
