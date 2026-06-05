/**
 * Upload product images directly from the browser to Cloudinary.
 * 
 * Flow:
 *  1. Ask our server for a signed upload token (tiny request — no image data).
 *  2. POST each file directly to Cloudinary's API (bypasses Vercel's 4.5 MB limit).
 *  3. Return the secure Cloudinary URLs.
 *
 * Falls back to the old local-server route when running on localhost (no Cloudinary needed).
 */

const IS_PRODUCTION = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');

async function uploadViaServer(params: { files: File[]; category: string; productFolder: string }): Promise<string[]> {
  const { files, category, productFolder } = params;
  const uploadFormData = new FormData();
  files.forEach((file) => uploadFormData.append('images', file));
  uploadFormData.append('category', category);
  uploadFormData.append('productFolder', productFolder);

  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    body: uploadFormData,
    credentials: 'include',
  });

  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch {
    throw new Error(`Upload failed (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }
  const body = data as { success?: boolean; error?: string; images?: string[] };
  if (!res.ok) throw new Error(body.error || `Upload failed (HTTP ${res.status})`);
  if (!body.success || !Array.isArray(body.images) || body.images.length === 0) {
    throw new Error(body.error || 'Upload response missing image URLs');
  }
  return body.images;
}

async function uploadDirectlyToCloudinary(params: { files: File[]; category: string; productFolder: string }): Promise<string[]> {
  const { files, category, productFolder } = params;

  const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
  const folder = `${categorySlug}/${productFolder}`;

  // 1. Get a signed token from our server (tiny — no images sent)
  let signRes: Response;
  try {
    signRes = await fetch('/api/admin/cloudinary-sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ folder }),
    });
  } catch (e) {
    throw new Error(`Network error reaching sign API: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `Sign API failed (HTTP ${signRes.status})`);
  }

  const { timestamp, signature, apiKey, cloudName, folder: signedFolder } =
    await signRes.json() as { timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string };

  // 2. Upload all files in parallel directly to Cloudinary from the browser
  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('api_key', apiKey);
    fd.append('timestamp', String(timestamp));
    fd.append('signature', signature);
    fd.append('folder', signedFolder);

    let uploadRes: Response;
    try {
      uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: fd }
      );
    } catch (e) {
      throw new Error(`Network error uploading to Cloudinary: ${e instanceof Error ? e.message : String(e)}`);
    }

    if (!uploadRes.ok) {
      const errBody = await uploadRes.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(errBody?.error?.message || `Cloudinary upload failed (HTTP ${uploadRes.status}) for ${file.name}`);
    }

    const result = await uploadRes.json() as { secure_url: string };
    return result.secure_url;
  };

  // Upload all files simultaneously
  const urls = await Promise.all(files.map(uploadFile));
  return urls;
}

export async function uploadAdminProductImages(params: {
  files: File[];
  category: string;
  productFolder: string;
}): Promise<string[]> {
  if (IS_PRODUCTION) {
    return uploadDirectlyToCloudinary(params);
  }
  return uploadViaServer(params);
}
