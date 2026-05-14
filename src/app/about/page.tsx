import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  FiHeart, FiStar, FiShield, FiTruck, FiRefreshCw,
  FiMessageCircle, FiArrowRight, FiMapPin,
} from 'react-icons/fi';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import Breadcrumb from '@/components/Breadcrumb';

export const metadata: Metadata = {
  title: 'Our Story | Darshan Style Hub™',
  description:
    'Meet the family behind Darshan Style Hub™ — a Jaipur-born brand bringing premium ethnic wear to women across India. Read our founder story and brand journey.',
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const VALUES = [
  {
    icon: <FiShield size={24} />,
    title: 'Authentic Quality',
    body: 'Every piece is inspected for fabric, stitching, and finish before it reaches you. No compromises on quality — ever.',
    bg: 'bg-blue-50',
    color: 'text-blue-600',
  },
  {
    icon: <FiHeart size={24} />,
    title: 'Made with Care',
    body: 'We work with local artisans and weavers from Jaipur and surrounding areas, keeping traditional craftsmanship alive.',
    bg: 'bg-pink-50',
    color: 'text-pink-600',
  },
  {
    icon: <FiMessageCircle size={24} />,
    title: 'Real Human Support',
    body: 'Message us on WhatsApp and a real person — not a bot — replies within hours. Sizing help, returns, anything.',
    bg: 'bg-green-50',
    color: 'text-green-600',
  },
  {
    icon: <FiStar size={24} />,
    title: 'Style for Every Woman',
    body: 'From everyday kurtis to festival co-ord sets, from XS to XXXL — we believe great style belongs to everyone.',
    bg: 'bg-amber-50',
    color: 'text-amber-600',
  },
  {
    icon: <FiTruck size={24} />,
    title: 'Nationwide Delivery',
    body: 'We ship pan-India using trusted logistics partners, with real-time tracking on every order.',
    bg: 'bg-purple-50',
    color: 'text-purple-600',
  },
  {
    icon: <FiRefreshCw size={24} />,
    title: 'Hassle-free Returns',
    body: 'Not the right fit? We offer easy returns and exchanges — because we want you to love what you wear.',
    bg: 'bg-rose-50',
    color: 'text-rose-600',
  },
] as const;

const MILESTONES = [
  {
    year: '2025',
    title: 'The beginning',
    desc: 'Darshan Style Hub™ was registered in Jaipur with a simple mission: make beautiful ethnic wear accessible to every Indian woman, wherever she lives.',
  },
  {
    year: 'Early 2025',
    title: 'First collection',
    desc: "We launched our debut collection of Anarkali suits and co-ord sets, sourced from local weavers in Sitapura's textile corridor.",
  },
  {
    year: 'Mid 2025',
    title: 'Growing community',
    desc: 'Word spread through Instagram and WhatsApp. Over 500 orders shipped in the first season, with customers from 40+ cities.',
  },
  {
    year: '2026',
    title: 'Pan-India presence',
    desc: 'Today we serve 2,500+ customers across 180+ cities — with kurtis, suits, co-ord sets, and tops for every occasion.',
  },
] as const;

const TEAM = [
  {
    name: 'Darshan',
    role: 'Founder & Curator',
    bio: "Grew up surrounded by Jaipur's textile bazaars. Darshan started the brand to bridge the gap between beautiful local craftsmanship and women who deserve to wear it — wherever they are.",
    initials: 'D',
    accent: 'bg-primary-600',
  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-accent-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-accent-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb items={[{ label: 'Our Story' }]} />
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-amber-600 text-white overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" aria-hidden />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-white/5 rounded-full" aria-hidden />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-5">
              <FiMapPin size={16} className="text-amber-300" />
              <span className="text-amber-200 text-sm font-medium tracking-wide uppercase">
                Sitapura, Jaipur · Est. 2025
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Jaipur's heart,<br />
              <span className="text-amber-300">your wardrobe.</span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 leading-relaxed max-w-2xl">
              Darshan Style Hub™ was born in the lanes of Sitapura — where master weavers and embroiderers
              have crafted textiles for generations. We bring that craftsmanship directly to women across India,
              at prices that are honest and fair.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-full hover:bg-amber-50 transition-colors"
              >
                Shop the collection <FiArrowRight size={16} />
              </Link>
              <a
                href="https://www.instagram.com/stylehubjaipur/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white font-medium px-6 py-3 rounded-full hover:bg-white/20 transition-colors"
              >
                <FaInstagram size={18} />
                Follow our journey
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOUNDER STORY ─────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Founder card */}
            <div className="order-2 lg:order-1">
              {TEAM.map((member) => (
                <div key={member.name}
                  className="bg-accent-50 rounded-3xl p-8 sm:p-10 border border-accent-200 relative overflow-hidden">
                  {/* Pattern */}
                  <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="50" fill="currentColor" className="text-primary-600" />
                    </svg>
                  </div>

                  {/* Avatar */}
                  <div className="flex items-center gap-5 mb-6">
                    <div className={`w-20 h-20 ${member.accent} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-display text-3xl font-bold">{member.initials}</span>
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-bold text-gray-900">{member.name}</h3>
                      <p className="text-primary-600 font-medium">{member.role}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                        <FiMapPin size={12} /> Jaipur, Rajasthan
                      </p>
                    </div>
                  </div>

                  <blockquote className="text-gray-700 leading-relaxed text-lg italic border-l-4 border-primary-300 pl-5">
                    &ldquo;{member.bio}&rdquo;
                  </blockquote>

                  <div className="flex gap-3 mt-8">
                    <a
                      href="https://www.instagram.com/stylehubjaipur/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
                    >
                      <FaInstagram size={14} /> Instagram
                    </a>
                    <a
                      href="https://wa.me/919019076335"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-green-600 transition-colors"
                    >
                      <FaWhatsapp size={14} /> WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Story text */}
            <div className="order-1 lg:order-2 space-y-6">
              <div>
                <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">Our Story</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mt-2 leading-snug">
                  Started in Jaipur,<br />loved across India
                </h2>
              </div>

              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Growing up in Jaipur, I was surrounded by the city's living textile tradition — block prints,
                  chikankari, Bandhani, Gota Patti. But I noticed a gap: women in other cities had little access to
                  authentic, well-crafted ethnic wear at fair prices.
                </p>
                <p>
                  So in 2025, Darshan Style Hub™ was born — not as a faceless online store, but as a personal promise:
                  every piece I list is something I'd proudly gift to my own family. We source directly from
                  artisans, keep margins honest, and stay in touch with our customers personally.
                </p>
                <p>
                  Today we serve women from Kashmir to Kanyakumari — but we still operate like a neighbourhood
                  boutique. Message us on WhatsApp, and I or someone from our small team replies. That personal
                  touch is our biggest product.
                </p>
              </div>

              <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5">
                <p className="text-primary-700 font-medium italic">
                  &ldquo;Clothing is never just fabric — it's how a woman shows up in the world. 
                  We take that seriously.&rdquo;
                </p>
                <p className="text-sm text-primary-500 mt-2">— Darshan, Founder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BRAND JOURNEY / MILESTONES ────────────────────── */}
      <section className="py-16 sm:py-20 bg-accent-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">Timeline</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mt-2">Our journey so far</h2>
          </div>

          <div className="relative">
            {/* Vertical line — desktop */}
            <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-accent-300" aria-hidden />

            <div className="space-y-8 sm:space-y-0">
              {MILESTONES.map((m, i) => (
                <div
                  key={m.year}
                  className={`relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 ${
                    i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                  }`}
                >
                  {/* Card */}
                  <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-accent-200 sm:max-w-[calc(50%-2.5rem)]">
                    <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">{m.year}</span>
                    <h3 className="font-display text-xl font-bold text-gray-900 mt-1 mb-2">{m.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{m.desc}</p>
                  </div>

                  {/* Center dot */}
                  <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 w-5 h-5 bg-primary-600 rounded-full border-4 border-white shadow" aria-hidden />

                  {/* Spacer for alternating layout */}
                  <div className="flex-1 hidden sm:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">What drives us</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mt-2">Our values</h2>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
              Not just words on a wall — these are the commitments we check every order against.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map((v) => (
              <div key={v.title}
                className="group bg-white rounded-2xl p-6 border border-accent-200 hover:border-primary-300 hover:shadow-md transition-all">
                <div className={`w-12 h-12 ${v.bg} ${v.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {v.icon}
                </div>
                <h3 className="font-display text-lg font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JAIPUR HERITAGE CALLOUT ───────────────────────── */}
      <section className="py-14 bg-gradient-to-r from-amber-50 via-[#FFF8E6] to-amber-50 border-y border-amber-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-4xl mb-4 block">🏰</span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Proud to be from Jaipur
          </h2>
          <p className="text-gray-700 leading-relaxed max-w-2xl mx-auto">
            Jaipur is not just our address — it's our identity. The Pink City has been a centre of textile excellence
            for centuries: <strong>Block prints, Leheriya, Bagru, Sanganeri</strong> — these traditions are woven
            into every piece we curate. When you wear Darshan Style Hub™, you carry a piece of that living heritage.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6 text-sm">
            {['Block Printing', 'Chikankari', 'Gota Patti', 'Bandhani', 'Sequin Work', 'Georgette Drapes'].map((t) => (
              <span key={t}
                className="bg-amber-100 text-amber-800 border border-amber-300 px-4 py-1.5 rounded-full font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-16 bg-primary-700 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Ready to find your next favourite outfit?
          </h2>
          <p className="text-primary-200 mb-8 max-w-xl mx-auto">
            Browse our full collection or reach out on WhatsApp — we love helping customers find the perfect fit.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-7 py-3.5 rounded-full hover:bg-amber-50 transition-colors"
            >
              Shop now <FiArrowRight size={16} />
            </Link>
            <a
              href="https://wa.me/919019076335"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white font-semibold px-7 py-3.5 rounded-full hover:bg-green-600 transition-colors"
            >
              <FaWhatsapp size={18} /> Chat with us
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
