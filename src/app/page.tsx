import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight, FiTruck, FiRefreshCw, FiShield, FiHeadphones } from 'react-icons/fi';
import ProductCard from '@/components/ProductCard';
import { getFeaturedProducts, getNewArrivals, getCategories } from '@/lib/products';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [featuredProducts, newArrivals, categories] = await Promise.all([
    getFeaturedProducts(),
    getNewArrivals(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
        {/* Light cream background */}
        <div className="absolute inset-0 bg-[#FFF8F0]">
          {/* Subtle decorative border at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-400 to-amber-400"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
            {/* Text Content */}
            <div className="text-center lg:text-left animate-fadeIn">
              {/* Logo Display */}
              <div className="mb-6 flex justify-center lg:justify-start">
                <Image
                  src="/products/logo.jpeg"
                  alt="Darshan Style Hub"
                  width={500}
                  height={220}
                  className="h-44 sm:h-56 lg:h-64 w-auto object-contain"
                  priority
                />
              </div>
              
              <span className="inline-block bg-amber-50 text-amber-800 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-amber-200">
                ✨ New Collection 2026
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Exquisite Sarees &
                <span className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 bg-clip-text text-transparent block">Designer Suits</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
                Discover our stunning collection of handcrafted sarees and elegant suits. 
                From traditional silk to modern designs, find your perfect ethnic wear.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/products?category=Sarees" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-medium rounded-full hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg shadow-amber-200">
                  Shop Sarees
                  <FiArrowRight />
                </Link>
                <Link href="/products?category=Suits" className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-gray-800 text-gray-800 font-medium rounded-full hover:bg-gray-800 hover:text-white transition-all">
                  Shop Suits
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="hidden lg:block relative">
              <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
                <Image
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop"
                  alt="Indian Saree Collection"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Floating Card */}
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">👗</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">500+ Happy Customers</p>
                    <p className="text-xs text-gray-500">This month</p>
                  </div>
                </div>
              </div>
              {/* Premium badge */}
              <div className="absolute top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium">
                Premium Quality
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white border-y border-accent-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3 p-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiTruck className="text-primary-600" size={24} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Free Shipping</h3>
                <p className="text-sm text-gray-500">On orders above ₹999</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiRefreshCw className="text-primary-600" size={24} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Easy Returns</h3>
                <p className="text-sm text-gray-500">7 days return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiShield className="text-primary-600" size={24} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Secure Payment</h3>
                <p className="text-sm text-gray-500">100% secure checkout</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiHeadphones className="text-primary-600" size={24} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">24/7 Support</h3>
                <p className="text-sm text-gray-500">Dedicated support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories - Sarees, Suits & Kurtis */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our beautiful collection of sarees, suits and kurtis for every occasion
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Sarees Category */}
            <Link
              href="/products?category=Sarees"
              className="group relative aspect-[3/4] rounded-3xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-rose-500 to-red-600" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                <span className="text-5xl mb-4">🥻</span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold mb-2">Sarees</h3>
                <p className="text-white/80 text-center text-sm mb-4">
                  Silk, Banarasi, Cotton & Wedding
                </p>
                <span className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-medium group-hover:bg-white/30 transition-all">
                  Explore <FiArrowRight />
                </span>
              </div>
            </Link>

            {/* Suits Category */}
            <Link
              href="/products?category=Suits"
              className="group relative aspect-[3/4] rounded-3xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-indigo-500 to-blue-600" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                <span className="text-5xl mb-4">👗</span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold mb-2">Suits</h3>
                <p className="text-white/80 text-center text-sm mb-4">
                  Anarkali, Salwar & Party Wear
                </p>
                <span className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-medium group-hover:bg-white/30 transition-all">
                  Explore <FiArrowRight />
                </span>
              </div>
            </Link>

            {/* Kurtis Category */}
            <Link
              href="/products?category=Kurtis"
              className="group relative aspect-[3/4] rounded-3xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-600" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                <span className="text-5xl mb-4">👚</span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold mb-2">Kurtis</h3>
                <p className="text-white/80 text-center text-sm mb-4">
                  Cotton, Printed & Embroidered
                </p>
                <span className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-medium group-hover:bg-white/30 transition-all">
                  Explore <FiArrowRight />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
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
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/products" className="btn-primary inline-flex items-center gap-2">
              View All Products <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary-700 to-primary-500">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <pattern id="banner-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="2" fill="white" />
                </pattern>
                <rect x="0" y="0" width="100" height="100" fill="url(#banner-pattern)" />
              </svg>
            </div>
            <div className="relative grid lg:grid-cols-2 gap-8 items-center p-8 lg:p-12">
              <div className="text-white">
                <span className="inline-block bg-white/20 px-4 py-1 rounded-full text-sm font-medium mb-4">
                  Limited Time Offer
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                  Wedding Season Sale
                </h2>
                <p className="text-white/80 mb-6 text-lg">
                  Get up to 40% off on bridal sarees and party wear suits. Use code <span className="font-bold">BRIDE40</span> at checkout.
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-full font-medium hover:bg-accent-100 transition-colors"
                >
                  Shop Sale <FiArrowRight />
                </Link>
              </div>
              <div className="hidden lg:flex justify-center">
                <div className="text-center text-white">
                  <span className="text-7xl font-display font-bold">40%</span>
                  <span className="block text-2xl font-medium">OFF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  New Arrivals
                </h2>
                <p className="text-gray-600">Fresh styles just dropped</p>
              </div>
              <Link
                href="/products?newArrival=true"
                className="hidden sm:inline-flex items-center gap-2 text-primary-600 font-medium hover:gap-3 transition-all"
              >
                View All <FiArrowRight />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-16 bg-accent-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-gray-600">Real reviews from real customers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Priya Sharma',
                location: 'Mumbai',
                review: 'Absolutely love the quality of sarees! The silk is genuine and the embroidery is exquisite. Will definitely order again.',
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
