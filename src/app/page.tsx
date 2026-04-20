import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight, FiTruck, FiRefreshCw, FiShield, FiHeadphones, FiDollarSign } from 'react-icons/fi';
import { FaMoneyBillWave } from 'react-icons/fa';
import ProductCard from '@/components/ProductCard';
import HeroCarousel from '@/components/HeroCarousel';
import AnimatedSection from '@/components/AnimatedSection';
import DeliveryPincodeChecker from '@/components/DeliveryPincodeChecker';
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
      {/* Hero Section */}
      <section className="relative min-h-[90vh] lg:min-h-[80vh] overflow-hidden">
        {/* Light cream background */}
        <div className="absolute inset-0 bg-[#FFF8F0]">
          {/* Subtle decorative border at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-400 to-amber-400"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
            {/* Text Content */}
            <div className="text-center lg:text-left animate-fadeIn">
              {/* Logo Display */}
              <div className="mb-4 flex justify-center lg:justify-start">
                <Image
                  src="/products/logo.jpeg"
                  alt="Darshan Style Hub"
                  width={400}
                  height={180}
                  className="h-24 sm:h-32 lg:h-44 w-auto object-contain mix-blend-multiply"
                  priority
                />
              </div>
              
              <span className="inline-block bg-amber-50 text-amber-800 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-amber-200">
                ✨ New Collection 2026
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Designer Suits &
                <span className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 bg-clip-text text-transparent block">Co Ord Sets</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
                Discover our stunning collection of designer suits and co ord sets. 
                From traditional designs to modern styles, find your perfect ethnic wear.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/products?category=Suits" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-medium rounded-full hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg shadow-amber-200">
                  Shop Suits
                  <FiArrowRight />
                </Link>
                <Link href="/products?category=Co Ord Sets" className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-gray-800 text-gray-800 font-medium rounded-full hover:bg-gray-800 hover:text-white transition-all">
                  Shop Co Ord Sets
                </Link>
              </div>
            </div>

            {/* Hero Image Carousel - Visible on all screens */}
            <div className="relative w-full max-w-sm sm:max-w-md mx-auto lg:max-w-none">
              <div className="relative w-full aspect-[2/3] sm:aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
                <HeroCarousel />
              </div>
              {/* Premium badge - hidden on mobile */}
              <div className="hidden sm:block absolute top-4 right-4 bg-gray-900 text-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium z-10">
                Premium Quality
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Compact */}
      <section className="py-4 bg-white border-y border-accent-200">
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

      {/* Pincode delivery check */}
      <section id="delivery" className="py-8 sm:py-10 bg-accent-50 border-y border-accent-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <DeliveryPincodeChecker variant="compact" />
          <p className="text-center text-sm text-gray-500 mt-4">
            <Link href="/delivery" className="text-primary-600 hover:text-primary-700 font-medium">
              Delivery info &amp; policies →
            </Link>
          </p>
        </div>
      </section>

      {/* Categories — rectangular cards */}
      <section className="py-12 sm:py-16 bg-white">
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
                    <div className="relative h-full min-h-[180px] w-full overflow-hidden rounded-xl bg-white/90">
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
      <section className="py-16 bg-white">
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
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Browse All Products */}
      <section className="py-16 bg-gradient-to-b from-white to-accent-50">
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

      {/* Testimonials */}
      <section className="py-16 bg-accent-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-gray-600">Real reviews from real customers</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Priya Sharma',
                location: 'Mumbai',
                review: 'Absolutely love the quality of my co ord set — fabric feels premium and the embroidery is exquisite. Will definitely order again!',
                rating: 5,
              },
              {
                name: 'Sneha Patel',
                location: 'Delhi',
                review: 'Ordered an Anarkali suit for my sister\'s wedding. The fitting was perfect and the fabric quality is amazing!',
                rating: 5,
              },
              {
                name: 'Anita Desai',
                location: 'Bangalore',
                review: 'Great collection of suits and amazing customer service. They helped me choose the perfect outfit for the occasion.',
                rating: 5,
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-4">{testimonial.review}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-medium">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
