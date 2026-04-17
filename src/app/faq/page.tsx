import type { Metadata } from 'next';
import Link from 'next/link';
import StaticInfoPage from '@/components/StaticInfoPage';

export const metadata: Metadata = {
  title: 'FAQs | Darshan Style Hub™',
  description: 'Frequently asked questions about orders, shipping, returns, and shopping at Darshan Style Hub.',
};

export default function FaqPage() {
  return (
    <StaticInfoPage
      title="Frequently asked questions"
      description="Quick answers about shopping with Darshan Style Hub™."
    >
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">Do you offer cash on delivery?</h2>
        <p>Yes—where COD is available at checkout, you can pay when your order is delivered.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">How long does delivery take?</h2>
        <p>
          Most orders reach metro cities within a few days after dispatch. See our{' '}
          <Link href="/shipping" className="text-primary-600 hover:text-primary-700 font-medium">
            shipping policy
          </Link>{' '}
          for details.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">Can I return or exchange?</h2>
        <p>
          Yes, subject to our{' '}
          <Link href="/returns" className="text-primary-600 hover:text-primary-700 font-medium">
            returns &amp; exchange
          </Link>{' '}
          policy.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">How do I contact you?</h2>
        <p>
          Visit{' '}
          <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-medium">
            Contact us
          </Link>{' '}
          or WhatsApp the number in the footer for the fastest response.
        </p>
      </section>
    </StaticInfoPage>
  );
}
