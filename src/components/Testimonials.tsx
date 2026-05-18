import { FiStar, FiCheckCircle, FiInstagram } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Link from 'next/link';

// ─── Review data ──────────────────────────────────────────────────────────────

interface Review {
  name: string;
  location: string;
  rating: number;
  review: string;
  product: string;
  date: string;
  avatarColor: string;
  source: 'google' | 'whatsapp' | 'instagram';
  helpful?: number;
}

const REVIEWS: Review[] = [
  {
    name: 'Priya Sharma',
    location: 'Mumbai',
    rating: 5,
    review: 'Absolutely love the quality of my co-ord set — fabric feels premium and the embroidery is exquisite. Will definitely order again! Received exactly what was shown in the photos.',
    product: 'Black Co-Ord Set',
    date: 'April 2026',
    avatarColor: 'bg-pink-500',
    source: 'google',
    helpful: 12,
  },
  {
    name: 'Sneha Patel',
    location: 'Delhi',
    rating: 5,
    review: 'Ordered an Anarkali suit for my sister\'s wedding. The fitting was perfect and the fabric quality is amazing! Got so many compliments at the wedding.',
    product: 'Anarkali Suit',
    date: 'March 2026',
    avatarColor: 'bg-purple-500',
    source: 'whatsapp',
    helpful: 9,
  },
  {
    name: 'Anita Desai',
    location: 'Bangalore',
    rating: 5,
    review: 'Great collection of suits and amazing customer service. They helped me choose the perfect outfit for my office event. Very patient and responsive on WhatsApp!',
    product: 'Printed Kurta Set',
    date: 'April 2026',
    avatarColor: 'bg-blue-500',
    source: 'google',
    helpful: 7,
  },
  {
    name: 'Kavya Reddy',
    location: 'Hyderabad',
    rating: 5,
    review: 'The red co-ord set is stunning — pictures don\'t do it justice. The fabric is breathable and perfect for summer. Delivery was super fast, came in 3 days!',
    product: 'Red Co-Ord Set',
    date: 'May 2026',
    avatarColor: 'bg-red-500',
    source: 'instagram',
    helpful: 15,
  },
  {
    name: 'Meera Joshi',
    location: 'Pune',
    rating: 5,
    review: 'Bought the orange embroidered kurta set. Stitching is impeccable and it fits true to size. Wore it to a puja and received many compliments. Will be ordering more!',
    product: 'Orange Embroidered Kurta',
    date: 'March 2026',
    avatarColor: 'bg-orange-500',
    source: 'google',
    helpful: 11,
  },
  {
    name: 'Pooja Singh',
    location: 'Jaipur',
    rating: 5,
    review: 'Being from Jaipur myself I know quality fabrics, and Darshan Style Hub delivers exactly that. The block print kurti is gorgeous and packaging was very neat.',
    product: 'Block Print Kurti',
    date: 'February 2026',
    avatarColor: 'bg-teal-500',
    source: 'whatsapp',
    helpful: 8,
  },
  {
    name: 'Ritu Agarwal',
    location: 'Lucknow',
    rating: 5,
    review: 'Ordered two suits for festive season — both arrived on time, well-packed, exactly matching the pictures. The grey floral palazzo set is especially beautiful.',
    product: 'Grey Floral Palazzo Set',
    date: 'January 2026',
    avatarColor: 'bg-indigo-500',
    source: 'google',
    helpful: 14,
  },
  {
    name: 'Divya Nair',
    location: 'Chennai',
    rating: 5,
    review: 'My go-to for ethnic wear now. Already placed 3 orders. The quality is consistent, returns are easy, and the team replies on WhatsApp within hours. Highly recommend!',
    product: 'Multiple orders',
    date: 'April 2026',
    avatarColor: 'bg-green-600',
    source: 'google',
    helpful: 21,
  },
  {
    name: 'Shreya Kulkarni',
    location: 'Nagpur',
    rating: 5,
    review: 'Bought the geometric embroidered kurta set. The v-neck detail is so elegant and the cotton is super comfortable for all-day wear. Size guide was accurate too!',
    product: 'Geometric Embroidered Kurta',
    date: 'May 2026',
    avatarColor: 'bg-rose-500',
    source: 'instagram',
    helpful: 6,
  },
  {
    name: 'Nandini Verma',
    location: 'Kolkata',
    rating: 4,
    review: 'Very good quality, delivery was quick. The rust orange kurta looks even better in person. Only minor feedback — wished it had more colour options. Otherwise perfect!',
    product: 'Rust Orange Kurta Set',
    date: 'March 2026',
    avatarColor: 'bg-amber-600',
    source: 'google',
    helpful: 5,
  },
  {
    name: 'Lakshmi Iyer',
    location: 'Coimbatore',
    rating: 5,
    review: 'The packaging was beautiful and the suit quality exceeded my expectations. The embroidery is hand-crafted quality at an online price. Will recommend to all my friends!',
    product: 'Embroidered Suit Set',
    date: 'February 2026',
    avatarColor: 'bg-violet-600',
    source: 'whatsapp',
    helpful: 10,
  },
  {
    name: 'Sunita Yadav',
    location: 'Bhopal',
    rating: 5,
    review: 'First time ordering from Darshan Style Hub and I\'m very impressed. The co-ord set fits perfectly, material is great. Customer service answered all my questions instantly.',
    product: 'Co-Ord Set',
    date: 'April 2026',
    avatarColor: 'bg-cyan-600',
    source: 'google',
    helpful: 8,
  },
];

// ─── Star distribution ────────────────────────────────────────────────────────
const RATING_DIST = [
  { stars: 5, count: 89, pct: 89 },
  { stars: 4, count: 7,  pct: 7  },
  { stars: 3, count: 3,  pct: 3  },
  { stars: 2, count: 1,  pct: 1  },
  { stars: 1, count: 0,  pct: 0  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <FiStar
          key={i}
          size={size}
          className={i <= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
}

function SourceIcon({ source }: { source: Review['source'] }) {
  if (source === 'google') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
        <svg width="10" height="10" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.77h5.4a4.62 4.62 0 0 1-2 3.04v2.52h3.24c1.9-1.74 3-4.3 3-7.33z" fill="#4285F4"/>
          <path d="M10 20c2.7 0 4.97-.9 6.62-2.44l-3.23-2.52c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H1.07v2.6A9.99 9.99 0 0 0 10 20z" fill="#34A853"/>
          <path d="M4.4 11.88A6.03 6.03 0 0 1 4.08 10c0-.65.1-1.3.31-1.88V5.52H1.07A9.98 9.98 0 0 0 0 10c0 1.6.38 3.12 1.07 4.48l3.33-2.6z" fill="#FBBC05"/>
          <path d="M10 3.96c1.46 0 2.78.5 3.81 1.5l2.86-2.86A9.97 9.97 0 0 0 10 0 9.99 9.99 0 0 0 1.07 5.52l3.33 2.6C5.2 5.72 7.4 3.96 10 3.96z" fill="#EA4335"/>
        </svg>
        Google
      </span>
    );
  }
  if (source === 'whatsapp') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
        <FaWhatsapp size={10} />
        WhatsApp
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full">
      <FiInstagram size={10} />
      Instagram
    </span>
  );
}

function ReviewCard({ r }: { r: Review }) {
  return (
    <div className="flex-shrink-0 w-[280px] sm:w-[320px] bg-white rounded-2xl p-5 shadow-sm border border-accent-200 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${r.avatarColor} rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm`}>
            {r.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
              <FiCheckCircle size={12} className="text-blue-500" title="Verified Purchase" />
            </div>
            <p className="text-xs text-gray-500">{r.location} · {r.date}</p>
          </div>
        </div>
        <SourceIcon source={r.source} />
      </div>

      {/* Stars */}
      <Stars n={r.rating} />

      {/* Review text */}
      <p className="text-sm text-gray-700 leading-relaxed flex-1 line-clamp-4">{r.review}</p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <span className="text-[10px] text-primary-600 font-semibold bg-primary-50 px-2 py-0.5 rounded-full">
          {r.product}
        </span>
        {r.helpful !== undefined && (
          <span className="text-[10px] text-gray-400">{r.helpful} found helpful</span>
        )}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Testimonials() {
  // Duplicate array for seamless loop
  const doubled = [...REVIEWS, ...REVIEWS];

  return (
    <section className="py-16 sm:py-20 bg-accent-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header + rating summary */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-12">

          {/* Left — heading */}
          <div className="max-w-md">
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-2">Reviews</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              What our customers say
            </h2>
            <p className="text-gray-600">
              Verified reviews from real customers — on Google, WhatsApp, and Instagram.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} size={20} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="text-2xl font-bold text-gray-900">4.9</span>
              <span className="text-gray-500 text-sm">from 500+ orders</span>
            </div>
          </div>

          {/* Right — star distribution */}
          <div className="w-full lg:w-64 space-y-2">
            {RATING_DIST.map(({ stars, count, pct }) => (
              <div key={stars} className="flex items-center gap-2.5">
                <span className="text-xs text-gray-600 w-3 shrink-0">{stars}</span>
                <FiStar size={11} className="text-yellow-400 fill-yellow-400 shrink-0" />
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-6 text-right shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auto-scrolling marquee — full width, overflow visible */}
      <div className="pause-on-hover">
        <div className="flex gap-4 animate-marquee w-max">
          {doubled.map((r, i) => (
            <ReviewCard key={`${r.name}-${i}`} r={r} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center">
        <p className="text-sm text-gray-600 text-center">
          Loved your purchase? Share your experience and help other customers.
        </p>
        <div className="flex gap-3 shrink-0">
          <a
            href="https://share.google/sj1MessxYKZV8cat2"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-full shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.77h5.4a4.62 4.62 0 0 1-2 3.04v2.52h3.24c1.9-1.74 3-4.3 3-7.33z" fill="#4285F4"/>
              <path d="M10 20c2.7 0 4.97-.9 6.62-2.44l-3.23-2.52c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H1.07v2.6A9.99 9.99 0 0 0 10 20z" fill="#34A853"/>
              <path d="M4.4 11.88A6.03 6.03 0 0 1 4.08 10c0-.65.1-1.3.31-1.88V5.52H1.07A9.98 9.98 0 0 0 0 10c0 1.6.38 3.12 1.07 4.48l3.33-2.6z" fill="#FBBC05"/>
              <path d="M10 3.96c1.46 0 2.78.5 3.81 1.5l2.86-2.86A9.97 9.97 0 0 0 10 0 9.99 9.99 0 0 0 1.07 5.52l3.33 2.6C5.2 5.72 7.4 3.96 10 3.96z" fill="#EA4335"/>
            </svg>
            Review on Google
          </a>
          <a
            href="https://wa.me/919019076335?text=Hi+I+want+to+share+my+feedback+about+my+Darshan+Style+Hub+order!"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-sm hover:bg-green-600 transition-colors"
          >
            <FaWhatsapp size={14} />
            Share on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
