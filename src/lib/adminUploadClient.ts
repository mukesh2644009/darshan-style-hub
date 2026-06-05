/**
 * Upload product images.
 * Flow: compress in browser → POST to our server → server uploads to Cloudinary.
 * Compression keeps files ~200-400 KB each, well under Vercel's 4.5 MB limit.
 */

/** Compress an image File to max 1200px wide, ~82% JPEG quality */
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const MAX_PX = 1200;
    const QUALITY = 0.82;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_PX) { height = Math.round(height * MAX_PX / width); width = MAX_PX; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(
          blob
            ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
            : file
        ),
        'image/jpeg', QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export async function uploadAdminProductImages(params: {
  files: File[];
  category: string;
  productFolder: string;
}): Promise<string[]> {
  const { files, category, productFolder } = params;

  // Step 1: compress all images in parallel in the browser
  const compressed = await Promise.all(files.map(compressImage));

  // Step 2: send compressed files to our server (small enough for Vercel)
  const formData = new FormData();
  compressed.forEach((f) => formData.append('images', f));
  formData.append('category', category);
  formData.append('productFolder', productFolder);

  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch {
    throw new Error(`Upload failed (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }
  const body = data as { success?: boolean; error?: string; images?: string[] };
  if (!res.ok) throw new Error(body.error || `Upload failed (HTTP ${res.status})`);
  if (!body.success || !Array.isArray(body.images)) throw new Error(body.error || 'No image URLs returned');
  return body.images;
}
