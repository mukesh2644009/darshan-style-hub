import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

export const metadata: Metadata = {
  title: 'Lookbook | Darshan Style Hub™',
  description:
    'Inspiration from our Jaipur studio — suits, co ord sets, kurtis & tops styled for real life. Shop the looks you love.',
  openGraph: {
    title: 'Lookbook | Darshan Style Hub™',
    description: 'Visual inspiration from Darshan Style Hub — ethnic and fusion wear from Jaipur.',
    url: 'https://www.darshanstylehub.com/lookbook',
  },
};

const looks = [
  { src: '/products/categories/suits.png', caption: 'Elegant suits — occasion-ready' },
  { src: '/products/categories/co-ord-sets.png', caption: 'Chic co ord sets — effortless matching' },
  { src: '/products/categories/kurti.png', caption: 'Stylish kurtis — everyday & festive' },
  { src: '/products/categories/tops.png', caption: 'Trendy tops — fusion & casual' },
  { src: '/products/kurtis/kurti-3/1.jpeg', caption: 'Fresh prints & colours' },
  { src: '/products/suits/suit-2/1.jpeg', caption: 'Classic silhouettes' },
];

export default function LookbookPage() {
  return (
    <div className="min-h-screen bg-accent-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-3">Lookbook</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A glimpse of the styles we love — from our campaigns and shoots. Tap through to shop similar pieces.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {looks.map((item, i) => (
            <figure
              key={i}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-[3/4] bg-gray-100">
                <Image
                  src={item.src}
                  alt={item.caption}
                  fill
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                />
              </div>
              <figcaption className="p-4 text-center">
                <p className="text-gray-800 font-medium text-sm sm:text-base">{item.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-14 text-center space-y-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white font-medium rounded-full hover:bg-primary-700 transition-colors"
          >
            Shop all products
            <FiArrowRight />
          </Link>
          <p>
            <Link href="/blog" className="text-primary-600 hover:underline text-sm font-medium">
              Read our Style Journal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
