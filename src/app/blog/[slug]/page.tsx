import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { FiArrowLeft, FiClock } from 'react-icons/fi';
import { blogPosts, getPostBySlug } from '@/data/blogPosts';

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: `${post.title} | Darshan Style Hub™`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://www.darshanstylehub.com/blog/${post.slug}`,
    },
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const paragraphs = post.content.split(/\n\n+/).filter(Boolean);

  return (
    <div className="min-h-screen bg-accent-50 py-12">
      <article className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link href="/blog" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 text-sm">
          <FiArrowLeft />
          Back to Style Journal
        </Link>

        <div className="relative aspect-[21/9] max-h-56 rounded-2xl overflow-hidden bg-gray-200 mb-8">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width:768px) 100vw, 768px"
          />
        </div>

        <header className="mb-8">
          <time className="text-sm text-gray-500" dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-3">{post.title}</h1>
          <p className="text-gray-600 text-lg">{post.excerpt}</p>
          <p className="text-sm text-gray-500 mt-2 inline-flex items-center gap-1">
            <FiClock className="w-4 h-4" />
            {post.readTime}
          </p>
        </header>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
              {p}
            </p>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/products" className="btn-primary inline-block text-center">
            Shop collection
          </Link>
          <Link href="/blog" className="inline-flex items-center justify-center px-6 py-3 rounded-full border-2 border-gray-300 text-gray-800 font-medium hover:bg-gray-50">
            More articles
          </Link>
        </div>
      </article>
    </div>
  );
}
