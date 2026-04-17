import Link from 'next/link';
import StaticInfoPage from '@/components/StaticInfoPage';

export default function AboutPage() {
  return (
    <StaticInfoPage
      title="About Darshan Style Hub™"
      description="A Jaipur-based brand bringing you designer suits, co ord sets, kurtis & tops — with care, quality, and service you can trust."
    >
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Our story</h2>
        <p>
          Established in <strong>2025</strong>, Darshan Style Hub™ was born from a simple idea: make beautiful ethnic
          and fusion wear easy to shop for women everywhere — starting from our home in{' '}
          <strong>Jaipur, Rajasthan</strong>. We curate and showcase pieces that work for festivals, weddings, office
          days, and everyday confidence.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">What we stand for</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Quality first</strong> — We focus on fabrics, fit, and finishing so you feel comfortable and
            well-dressed.
          </li>
          <li>
            <strong>Honest service</strong> — Clear communication on orders, sizing help, and support when you need it.
          </li>
          <li>
            <strong>Accessible style</strong> — From classic suits to trendy co ord sets, kurtis, and tops — something
            for every mood and occasion.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Where we are</h2>
        <p>
          Our team operates from <strong>Sitapura, Jaipur</strong>, with shipping across India. Whether you shop
          online or message us on WhatsApp, we&apos;re here to help you find the right outfit.
        </p>
      </section>

      <section className="pt-2 flex flex-wrap gap-4">
        <Link
          href="/products"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Shop the collection
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border-2 border-gray-300 text-gray-800 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Contact us
        </Link>
      </section>
    </StaticInfoPage>
  );
}
