import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { MAX_ADMIN_IMAGE_BYTES, MAX_ADMIN_IMAGE_MB } from '@/lib/uploadLimits';
import path from 'path';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// On Vercel (production): upload to Cloudinary. Locally too whenever the
// Cloudinary keys are in .env — products added from the laptop admin (e.g. the
// "Load from Sheet" flow) must show on the live site, not only in public/.
const IS_VERCEL = !!process.env.VERCEL;
const USE_CLOUDINARY = IS_VERCEL || !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);


export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Check Cloudinary config. `vercel env pull` writes sensitive vars as the
    // literal "[SENSITIVE]", so a pulled local .env looks set but isn't.
    if (USE_CLOUDINARY) {
      const missing = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
        .filter(k => !process.env[k] || /SENSITIVE/.test(process.env[k]!));
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Cloudinary keys missing: ${missing.join(', ')}. On the laptop, put the real values in .env.local (Cloudinary → Settings → API Keys) and restart the dev server; on Vercel, add them under Settings → Environment Variables.` },
          { status: 500 }
        );
      }
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    // Optional per-photo angle labels (front, back, side, detail, lookshot…) —
    // kept in the file name so Myntra/Flipkart exports can tell the angles apart.
    let labels: string[] = [];
    try { labels = JSON.parse((formData.get('labels') as string) || '[]'); } catch { labels = []; }
    const keepNames = formData.get('keepNames') === '1';
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
      const label = String(labels[i] || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      // Photos converted for Myntra already carry an SEO name
      // ("<title>_main_photo_<sku>.jpg") — keep it on the site too.
      const seoName = keepNames
        ? file.name.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/g, '-').slice(0, 180)
        : '';
      const fileName = seoName
        ? `${seoName}.${ext}`
        : label ? `${i + 1}-${label}.${ext}` : `${i + 1}.${ext}`;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (USE_CLOUDINARY) {
        // Production (and local when configured): upload to Cloudinary
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
    // Cloudinary rejects with a plain { message, http_code } object, not an Error.
    const message = error instanceof Error
      ? error.message
      : (error as { message?: string })?.message || 'Failed to upload images';
    const detail = error instanceof Error ? error.stack : String(error);
    return NextResponse.json({ error: message, detail }, { status: 500 });
  }
}
