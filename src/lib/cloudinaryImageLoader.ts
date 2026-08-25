// Global next/image loader. Cloudinary already stores/serves optimized images,
// so we ask Cloudinary to resize/re-encode via URL transforms instead of
// routing every image through Vercel's Image Optimization (which has a hard
// monthly transformation quota on the Hobby plan and would otherwise
// re-transform images Cloudinary already optimized).
type LoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

export default function cloudinaryImageLoader({ src, width, quality }: LoaderProps): string {
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    const q = quality || 75;
    return src.replace('/upload/', `/upload/f_auto,q_${q},w_${width}/`);
  }
  // Local (/public) assets and any other remote source: serve as-is.
  return src;
}
