/**
 * Upload product images.
 * - Tries direct browser → Cloudinary upload first (works on Vercel, no size limit).
 * - Falls back to server route for local dev (when Cloudinary isn't configured).
 */

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
    throw new Error(`Upload failed (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }
  const body = data as { success?: boolean; error?: string; images?: string[] };
  if (!res.ok) throw new Error(body.error || `Upload failed (HTTP ${res.status})`);
  if (!body.success || !Array.isArray(body.images)) throw new Error(body.error || 'No image URLs returned');
  return body.images;
}

async function uploadViaCloudinary(params: { files: File[]; category: string; productFolder: string }): Promise<string[]> {
  const { files, category, productFolder } = params;
  const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
  const folder = `${categorySlug}/${productFolder}`;

  // Step 1: get signature from our server
  const signRes = await fetch('/api/admin/cloudinary-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ folder }),
  });

  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `Failed to get upload credentials (HTTP ${signRes.status})`);
  }

  const creds = await signRes.json() as {
    timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string;
  };

  if (!creds.cloudName || creds.cloudName === 'undefined') {
    throw new Error('Cloudinary cloud name is missing. Check CLOUDINARY_CLOUD_NAME in Vercel environment variables.');
  }

  // Step 2: upload all files in parallel directly to Cloudinary
  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('api_key', creds.apiKey);
    fd.append('timestamp', String(creds.timestamp));
    fd.append('signature', creds.signature);
    fd.append('folder', creds.folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${creds.cloudName}/image/upload`,
      { method: 'POST', body: fd }
    );

    if (!uploadRes.ok) {
      const errBody = await uploadRes.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(errBody?.error?.message || `Cloudinary upload failed (HTTP ${uploadRes.status}) for ${file.name}`);
    }

    const result = await uploadRes.json() as { secure_url: string };
    return result.secure_url;
  };

  return Promise.all(files.map(uploadFile));
}

export async function uploadAdminProductImages(params: {
  files: File[];
  category: string;
  productFolder: string;
}): Promise<string[]> {
  // Always try Cloudinary first. If the sign endpoint says Cloudinary isn't configured
  // (local dev without env vars), fall back to the server-side file upload.
  try {
    const urls = await uploadViaCloudinary(params);
    return urls;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Only fall back to server if it's a config issue (local dev), not a real error
    if (msg.includes('Cloudinary is not configured') || msg.includes('CLOUDINARY_CLOUD_NAME')) {
      return uploadViaServer(params);
    }
    throw err;
  }
}
