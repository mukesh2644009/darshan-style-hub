import Image from 'next/image';
import Link from 'next/link';
import { FiHeart, FiMessageCircle, FiInstagram, FiCamera, FiGift, FiArrowRight } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

// ─── "Customer posts" using actual product photos ─────────────────────────────
// These simulate Instagram customer posts using real product images.
// Replace with real Instagram API data once the official Basic Display API token is configured.

interface IGPost {
  image: string;
  username: string;
  caption: string;
  likes: number;
  comments: number;
  productHref: string;
  tag: string;
}

const IG_POSTS: IGPost[] = [
  {
    image: '/products/co-ord-sets/darshan-style-hub-women-s-red-co-ord-set-boat-neck-sleeveless-ethnic-set/1.png',
    username: '@priya.jaipur',
    caption: 'Obsessed with this red co-ord set! Perfect for festive season 🧡',
    likes: 234,
    comments: 18,
    productHref: '/products',
    tag: '#DarshanStyleHub',
  },
  {
    image: '/products/suits/suit-3/1.jpeg',
    username: '@sneha.styles',
    caption: 'Wedding season sorted! Got so many compliments wearing this 💫',
    likes: 412,
    comments: 31,
    productHref: '/products',
    tag: '#DarshanStyleHub',
  },
  {
    image: '/products/co-ord-sets/darshan-style-hub-women-s-black-co-ord-set-boat-neck-sleeveless-ethnic-set/1.png',
    username: '@kavya_outfits',
    caption: 'The black co-ord is giving all the right vibes ✨ So comfortable too!',
    likes: 188,
    comments: 14,
    productHref: '/products',
    tag: '#StyleHubJaipur',
  },
  {
    image: '/products/suits/darshan-style-hub-women-s-orange-embroidered-cotton-kurta-set-round-neck-with-tie-up-tassels-sleeveless-straight-pants-ethnic-wear/1.jpeg',
    username: '@meera_ethnic',
    caption: 'Orange embroidered kurta is pure fire 🔥 Love the tassels detail!',
    likes: 321,
    comments: 24,
    productHref: '/products',
    tag: '#DarshanStyleHub',
  },
  {
    image: '/products/kurtis/kurti-3/1.jpeg',
    username: '@ritu.k',
    caption: 'Everyday ethnic done right 🙌 This kurti is my new favourite!',
    likes: 156,
    comments: 9,
    productHref: '/products',
    tag: '#DarshanStyleHub',
  },
  {
    image: '/products/suits/darshan-style-hub-women-grey-pink-floral-printed-a-line-kurta-set-with-straight-palazzo-round-neck-sleeveless-ethnic-set/1.jpeg',
    username: '@anita.mumbai',
    caption: 'Grey floral palazzo set is so dreamy 💐 Perfect for office & outings!',
    likes: 289,
    comments: 22,
    productHref: '/products',
    tag: '#StyleHubJaipur',
  },
  {
    image: '/products/co-ord-sets/co-ord-set-4/1.png',
    username: '@pooja_fashion',
    caption: 'Co-ord obsession continues 😍 This one arrived so fast!',
    likes: 176,
    comments: 11,
    productHref: '/products',
    tag: '#DarshanStyleHub',
  },
  {
    image: '/products/suits/suit-2/1.jpeg',
    username: '@divya.style',
    caption: 'Festival ready in this stunning suit set! Quality is 10/10 🌟',
    likes: 445,
    comments: 37,
    productHref: '/products',
    tag: '#DarshanStyleHub',
  },
  {
    image: '/products/kurtis/kurti-4/1.jpeg',
    username: '@nandini_vibes',
    caption: 'Casual Friday done ethnic 🌸 Loving this kurti from @stylehubjaipur',
    likes: 201,
    comments: 16,
    productHref: '/products',
    tag: '#StyleHubJaipur',
  },
];

// ─── How-it-works steps for UGC section ──────────────────────────────────────
const HOW_IT_WORKS = [
  { step: '01', title: 'Shop & receive', desc: 'Place your order on Darshan Style Hub and receive your outfit.' },
  { step: '02', title: 'Wear & photograph', desc: 'Wear your outfit and click a photo you love!' },
  { step: '03', title: 'Tag us', desc: 'Post on Instagram and tag @stylehubjaipur or use #DarshanStyleHub.' },
  { step: '04', title: 'Get featured!', desc: "We'll feature your photo on our website and Instagram page." },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────
export default function InstagramFeed() {
  return (
    <>
      {/* ── Instagram Feed Grid ───────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
                  <FiInstagram size={16} className="text-white" />
                </div>
                <span className="font-semibold text-gray-700">@stylehubjaipur</span>
                <span className="text-xs text-gray-400">· 5K+ followers</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
                Customer looks we love
              </h2>
              <p className="text-gray-600 mt-1">
                Real customers, real outfits. Tag us to be featured!
              </p>
            </div>
            <a
              href="https://www.instagram.com/stylehubjaipur/"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 hover:shadow-lg transition-all"
            >
              <FiInstagram size={16} />
              Follow us
            </a>
          </div>

          {/* 3×3 grid */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            {IG_POSTS.map((post, i) => (
              <a
                key={i}
                href="https://www.instagram.com/stylehubjaipur/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden group bg-accent-100 block"
              >
                <Image
                  src={post.image}
                  alt={post.caption}
                  fill
                  sizes="(max-width:640px) 33vw, (max-width:1024px) 25vw, 220px"
                  quality={70}
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-3">
                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-white text-sm font-semibold">
                    <span className="flex items-center gap-1.5">
                      <FiHeart size={16} className="fill-white" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FiMessageCircle size={16} />
                      {post.comments}
                    </span>
                  </div>
                  <p className="text-white text-[11px] text-center line-clamp-2 leading-snug hidden sm:block">
                    {post.username}
                  </p>
                </div>

                {/* Instagram icon top-right — always visible */}
                <div className="absolute top-2 right-2 w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <FiInstagram size={12} className="text-pink-600" />
                </div>

                {/* Tag bottom-left — visible on large screens */}
                <div className="absolute bottom-2 left-2 hidden sm:block">
                  <span className="text-[10px] text-white font-semibold bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {post.tag}
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* View more on Instagram */}
          <div className="mt-6 text-center">
            <a
              href="https://www.instagram.com/stylehubjaipur/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-full px-5 py-2.5 hover:border-gray-400 transition-all"
            >
              <FiInstagram size={16} className="text-pink-500" />
              View all posts on Instagram
              <FiArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ── UGC "Tag us" CTA ──────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-primary-700 via-primary-600 to-amber-600 text-white overflow-hidden relative">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" aria-hidden />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" aria-hidden />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — CTA copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/30 rounded-full px-4 py-2">
                <FiCamera size={16} />
                <span className="text-sm font-semibold">Get Featured</span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl font-bold leading-snug">
                Wearing Darshan Style Hub?<br />
                <span className="text-amber-300">Show us your look!</span>
              </h2>

              <p className="text-primary-100 leading-relaxed max-w-md">
                Tag <strong className="text-white">@stylehubjaipur</strong> or use{' '}
                <strong className="text-amber-300">#DarshanStyleHub</strong> in your post —
                and we&apos;ll feature your photo right here on this page. Every week we pick
                our favourite look and gift a special discount!
              </p>

              {/* Hashtags */}
              <div className="flex flex-wrap gap-2">
                {['#DarshanStyleHub', '#StyleHubJaipur', '#EthnicWear', '#JaipurFashion'].map((tag) => (
                  <span key={tag}
                    className="bg-white/15 border border-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://www.instagram.com/stylehubjaipur/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white text-primary-700 font-semibold px-5 py-3 rounded-full hover:bg-amber-50 transition-colors shadow"
                >
                  <FiInstagram size={18} />
                  Tag on Instagram
                </a>
                <a
                  href="https://wa.me/919019076335?text=Hi!+I%27d+like+to+share+a+photo+of+me+wearing+my+Darshan+Style+Hub+outfit+%F0%9F%91%97"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500 text-white font-semibold px-5 py-3 rounded-full hover:bg-green-600 transition-colors"
                >
                  <FaWhatsapp size={18} />
                  Send via WhatsApp
                </a>
              </div>
            </div>

            {/* Right — How it works */}
            <div className="space-y-4">
              <p className="text-primary-200 text-sm font-semibold uppercase tracking-widest mb-6">
                How it works
              </p>
              {HOW_IT_WORKS.map((step) => (
                <div key={step.step} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 bg-white/15 border border-white/25 rounded-xl flex items-center justify-center shrink-0 font-bold text-amber-300 text-sm group-hover:bg-white/25 transition-colors">
                    {step.step}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{step.title}</p>
                    <p className="text-primary-200 text-sm mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}

              {/* Bonus incentive card */}
              <div className="mt-6 bg-white/10 border border-white/20 rounded-2xl p-4 flex items-start gap-3">
                <FiGift size={22} className="text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Weekly Featured Look</p>
                  <p className="text-primary-200 text-sm mt-0.5">
                    The best customer photo each week wins a <strong className="text-amber-300">₹200 off</strong> voucher on their next order!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
