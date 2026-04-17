import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight, FiClock } from 'react-icons/fi';
import { blogPosts } from '@/data/blogPosts';

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-accent-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-3">Style Journal</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Styling ideas, fabric care, and trends — for suits, co ord sets, kurtis & more. New posts added
            regularly.
          </p>
        </div>

        <div className="grid gap-8 sm:gap-10">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col sm:flex-row"
            >
              <Link href={`/blog/${post.slug}`} className="relative sm:w-72 aspect-[4/3] sm:aspect-auto sm:min-h-[220px] block bg-gray-100">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width:640px) 100vw, 288px"
                />
              </Link>
              <div className="p-6 sm:p-8 flex flex-col justify-center flex-1">
                <time className="text-xs text-gray-500 mb-2" dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  <Link href={`/blog/${post.slug}`} className="hover:text-primary-600 transition-colors">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <FiClock className="w-4 h-4" />
                    {post.readTime}
                  </span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-primary-600 font-medium hover:gap-2 transition-all"
                  >
                    Read article <FiArrowRight />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/lookbook" className="text-primary-600 font-medium hover:underline">
            View lookbook →
          </Link>
        </div>
      </div>
    </div>
  );
}
