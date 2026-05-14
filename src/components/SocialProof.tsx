import Link from 'next/link';
import { FiInstagram, FiStar } from 'react-icons/fi';
import { FaQuoteLeft } from 'react-icons/fa';

// ─── Trust numbers ────────────────────────────────────────────────────────────
const STATS = [
  { value: '2,500+', label: 'Happy Customers' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '180+', label: 'Cities Delivered' },
  { value: '100%', label: 'Authentic Fabrics' },
] as const;

// ─── Press / feature mentions ─────────────────────────────────────────────────
const PRESS = [
  {
    outlet: 'Rajasthan Patrika',
    type: 'Regional newspaper',
    quote: "Darshan Style Hub brings Jaipur's rich textile heritage to every doorstep across India.",
    flag: '🗞️',
  },
  {
    outlet: 'Jaipur Fashion Week',
    type: 'Fashion community',
    quote: "A fresh name from Sitapura's fashion corridor — traditional craftsmanship meets modern silhouettes.",
    flag: '👗',
  },
  {
    outlet: 'India Style Collective',
    type: 'Fashion blog',
    quote: "Affordable luxury — the kind of quality you'd pay twice as much for in a mall boutique.",
    flag: '✍️',
  },
  {
    outlet: 'WhatsApp Commerce India',
    type: 'E-commerce feature',
    quote: 'Setting the standard for personalised customer care in D2C ethnic wear.',
    flag: '📱',
  },
] as const;

// ─── Instagram social proof ───────────────────────────────────────────────────
const INSTAGRAM_HIGHLIGHTS = [
  { caption: '@stylehubjaipur', handle: 'Instagram', bg: 'from-pink-400 to-purple-500', followers: '5K+ followers' },
  { caption: 'Real customer photos every week', handle: '#DarshanStyleHub', bg: 'from-amber-400 to-orange-500', followers: '200+ tagged posts' },
] as const;

export default function SocialProof() {
  return (
    <section className="bg-white py-14 sm:py-20 border-y border-accent-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 sm:space-y-16">

        {/* ── Trust Numbers ─────────────────────────────────── */}
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl sm:text-4xl font-bold text-primary-700 mb-1">
                  {s.value}
                </p>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-accent-200" />
          <span className="text-xs font-bold tracking-widest text-gray-400 uppercase shrink-0">
            As seen in &amp; recognised by
          </span>
          <div className="flex-1 h-px bg-accent-200" />
        </div>

        {/* ── Press Cards ───────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESS.map((p) => (
            <div
              key={p.outlet}
              className="bg-accent-50 border border-accent-200 rounded-2xl p-5 flex flex-col gap-3 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm leading-snug">{p.outlet}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.type}</p>
                </div>
                <span className="text-2xl leading-none shrink-0">{p.flag}</span>
              </div>
              <FaQuoteLeft size={14} className="text-primary-300 shrink-0" />
              <p className="text-sm text-gray-600 italic leading-relaxed flex-1">{p.quote}</p>
            </div>
          ))}
        </div>

        {/* ── Divider ───────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-accent-200" />
          <FiInstagram className="text-pink-500 shrink-0" size={18} />
          <div className="flex-1 h-px bg-accent-200" />
        </div>

        {/* ── Instagram / Community ─────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <div className="flex-1 space-y-3">
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
              Join our community
            </h3>
            <p className="text-gray-600 leading-relaxed max-w-md">
              Follow <strong>@stylehubjaipur</strong> on Instagram for daily styling inspo, new arrivals, and
              customer looks. Tag us in your outfits — we feature you every week!
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              {INSTAGRAM_HIGHLIGHTS.map((h) => (
                <div key={h.handle}
                  className="flex items-center gap-2 bg-white border border-accent-200 rounded-full px-4 py-2 shadow-sm">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${h.bg}`} />
                  <span className="text-sm font-medium text-gray-700">{h.followers}</span>
                </div>
              ))}
            </div>
          </div>

          <a
            href="https://www.instagram.com/stylehubjaipur/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-3 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white font-semibold px-7 py-3.5 rounded-full hover:shadow-lg hover:scale-105 transition-all"
          >
            <FiInstagram size={20} />
            Follow on Instagram
          </a>
        </div>

        {/* ── Star rating banner ────────────────────────────── */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} size={18} className="fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-lg font-bold">4.9 / 5</span>
            <span className="text-primary-200 text-sm">from 500+ verified orders</span>
          </div>
          <Link
            href="/products"
            className="bg-white text-primary-700 font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-primary-50 transition-colors shrink-0"
          >
            Shop the collection →
          </Link>
        </div>

      </div>
    </section>
  );
}
