/**
 * Upload product images to /api/admin/upload (writes under public/products/...).
 * Uses credentials so the httpOnly admin session cookie is always sent.
 */
export async function uploadAdminProductImages(params: {
  files: File[];
  category: string;
  productFolder: string;
}): Promise<string[]> {
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
  try {
    data = JSON.parse(text);
  } catch {
    const preview = text.replace(/\s+/g, ' ').trim().slice(0, 200);
    throw new Error(
      `Upload failed (HTTP ${res.status}). The server did not return JSON — often: opened the site on a different host than login (use only http://localhost:PORT or only http://127.0.0.1:PORT), database not running, or you are on Vercel (filesystem uploads are not supported there). Preview: ${preview || '(empty body)'}`,
    );
  }

  const body = data as { success?: boolean; error?: string; images?: string[] };
  if (!res.ok) {
    throw new Error(body.error || `Upload failed (HTTP ${res.status})`);
  }
  if (!body.success || !Array.isArray(body.images) || body.images.length === 0) {
    throw new Error(body.error || 'Upload response missing image URLs');
  }
  return body.images;
}
