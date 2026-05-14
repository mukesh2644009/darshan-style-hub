import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight, FiTruck, FiRefreshCw, FiShield, FiHeadphones, FiDollarSign } from 'react-icons/fi';
import { FaMoneyBillWave } from 'react-icons/fa';
import ProductCard from '@/components/ProductCard';
import HeroCarousel from '@/components/HeroCarousel';
import AnimatedSection from '@/components/AnimatedSection';
import RecentlyViewed from '@/components/RecentlyViewed';
import SocialProof from '@/components/SocialProof';
import Testimonials from '@/components/Testimonials';
import InstagramFeed from '@/components/InstagramFeed';
import { getFeaturedProducts, getProducts, type Product } from '@/lib/products';

export const dynamic = 'force-dynamic';

/** Category tiles — full artwork fits in circle (object-contain); files in /public/products/categories/ */
const shopCategoryCircles = [
  {
    label: 'Suits',
    href: '/products?category=Suits',
    image: '/products/categories/suits.png',
    alt: 'Elegant suits',
  },
  {
    label: 'Co Ord Sets',
    href: '/products?category=Co Ord Sets',
    image: '/products/categories/co-ord-sets.png',
    alt: 'Chic co ord sets',
  },
  {
    label: 'Kurti',
    href: '/products?category=Kurti',
    image: '/products/categories/kurti.png',
    alt: 'Stylish kurtis',
  },
  {
    label: 'Tops',
    href: '/products?category=Tops',
    image: '/products/categories/tops.png',
    alt: 'Trendy tops',
  },
] as const;

export default async function Home() {
  let featuredProducts: Product[] = [];
  let allProducts: Product[] = [];
  try {
    [featuredProducts, allProducts] = await Promise.all([
      getFeaturedProducts(),
      getProducts({}),
    ]);
  } catch (err) {
    console.error(
      '[home] Could not load products — check DATABASE_URL and that the database is running (e.g. `npx prisma db push` + seed).',
      err,
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero: desktop uses object-cover in carousel; below lg, carousel uses object-contain so wide banners are not side-cropped */}
      <section className="relative overflow-hidden bg-[#FFF8F0]" aria-label="Featured collections">
        <h1 className="sr-only">Darshan Style Hub — designer suits, co ord sets &amp; ethnic wear from Jaipur</h1>
        {/* Below lg: aspect 192∶65 matches banners so object-contain has no thick letterboxing. lg+: cinematic height + object-cover. */}
        <div className="relative mx-auto w-full min-w-0 max-w-[min(100vw,calc(72vh*192/65))] aspect-[192/65] overflow-hidden rounded-none bg-[#FFF8F0] lg:aspect-auto lg:min-h-[220px] lg:h-[min(72vh,max(calc(100vw*65/192),min(42dvh,360px)))]">
          <div className="absolute inset-0">
            <HeroCarousel fullBleed cinematic />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[14] h-5 bg-gradient-to-t from-primary-900/10 to-transparent lg:h-12 xl:h-14"
            aria-hidden
          />
        </div>

        <div
          className="relative z-[21] h-1 w-full bg-gradient-to-r from-amber-500 via-rose-400 to-amber-500"
          aria-hidden
        />
      </section>

      {/* Features - Compact */}
      <section className="py-4 bg-[#FFF8E6] border-y border-accent-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <FaMoneyBillWave className="text-green-600" size={18} />
              <span className="text-sm font-medium text-green-700">Cash on Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <FiTruck className="text-primary-600" size={18} />
              <span className="text-sm text-gray-700">Free Shipping ₹999+</span>
            </div>
            <div className="flex items-center gap-2">
              <FiRefreshCw className="text-primary-600" size={18} />
              <span className="text-sm text-gray-700">Easy Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <FiShield className="text-primary-600" size={18} />
              <span className="text-sm text-gray-700">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <FiHeadphones className="text-primary-600" size={18} />
              <span className="text-sm text-gray-700">Same-day reply</span>
            </div>
          </div>
        </div>
      </section>


      {/* Categories — rectangular cards */}
      <section className="py-12 sm:py-16 bg-[#FFF8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-8 sm:mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Shop by Category
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
              Suits, co ord sets, kurtis & tops — pick a style and explore the collection
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10 max-w-5xl mx-auto">
            {shopCategoryCircles.map((item, index) => (
              <AnimatedSection key={item.href} delay={0.05 * (index + 1)} className="w-full">
                <Link
                  href={item.href}
                  className="group flex flex-col items-center gap-3 sm:gap-3.5 w-full"
                >
                  <div
                    className="relative w-full aspect-[3/4] max-h-[300px] sm:max-h-[340px] lg:max-h-[380px] mx-auto rounded-2xl border-2 border-gray-600 shadow-md ring-1 ring-gray-400/70 group-hover:border-gray-700 group-hover:ring-gray-500/80 group-hover:shadow-lg transition-all duration-300 bg-gradient-to-b from-amber-50/90 to-gray-100 p-2 sm:p-2.5"
                  >
                    <div className="relative h-full min-h-[180px] w-full overflow-hidden rounded-xl bg-[#FFF8E6]/90">
                      <Image
                        src={item.image}
                        alt={item.alt}
                        fill
                        sizes="(max-width: 640px) 42vw, (max-width: 1024px) 22vw, 260px"
                        className="object-contain object-center p-1 sm:p-2 transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  </div>
                  <span className="text-center text-sm sm:text-base font-semibold text-gray-800 group-hover:text-primary-600 transition-colors max-w-full px-1 leading-tight">
                    {item.label}
                  </span>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-[#FFF8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Featured Collection
              </h2>
              <p className="text-gray-600">Handpicked favorites our customers love</p>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-2 text-primary-600 font-medium hover:gap-3 transition-all"
            >
              View All <FiArrowRight />
            </Link>
          </AnimatedSection>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Browse All Products */}
      <section className="py-16 bg-gradient-to-b from-[#FFF8E6] to-[#FFF8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Browse All Products
            </h2>
            <p className="text-gray-600">Explore our complete collection of suits & co-ord sets</p>
          </AnimatedSection>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {allProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Social proof — "As Seen In", trust numbers, Instagram */}
      <SocialProof />

      {/* Recently Viewed — client component, renders only when localStorage has items */}
      <RecentlyViewed />

      {/* Rich testimonials — auto-scrolling marquee with 12 reviews + rating summary */}
      <Testimonials />

      {/* Instagram feed grid + UGC "Tag us" CTA */}
      <InstagramFeed />
    </div>
  );
}
