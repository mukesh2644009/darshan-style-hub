// Server-only: upload one image buffer to Cloudinary at darshan/<folder>/<fileName>.
export async function uploadToCloudinary(buffer: Buffer, folder: string, fileName: string): Promise<string> {
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

/** The real Cloudinary keys are present (not missing, not Vercel's "[SENSITIVE]" placeholder). */
export function cloudinaryConfigured(): boolean {
  return ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    .every((k) => !!process.env[k] && !/SENSITIVE/.test(process.env[k]!));
}

/** Same folder naming the upload route uses: products/<category>/<product-slug>. */
export function productImageFolder(category: string, productName: string): string {
  const categoryFolder = category.toLowerCase().replace(/\s+/g, '-');
  const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
  return `${categoryFolder}/${slug || `product-${Date.now()}`}`;
}
