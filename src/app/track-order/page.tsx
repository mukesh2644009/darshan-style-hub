import type { Metadata } from 'next';
import Link from 'next/link';
import StaticInfoPage from '@/components/StaticInfoPage';

export const metadata: Metadata = {
  title: 'Track Your Order | Darshan Style Hub™',
  description: 'Track your Darshan Style Hub order status and delivery updates.',
};

export default function TrackOrderPage() {
  return (
    <StaticInfoPage
      title="Track your order"
      description="We send order updates by SMS and email. You can also reach us on WhatsApp with your order ID."
    >
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">How to track</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Check the confirmation email or SMS for your order number.</li>
          <li>
            Open{' '}
            <Link href="/my-orders" className="text-primary-600 hover:text-primary-700 font-medium">
              My orders
            </Link>{' '}
            (signed-in customers) to see status and details.
          </li>
          <li>
            Need help?{' '}
            <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-medium">
              Contact us
            </Link>{' '}
            or WhatsApp us with your order ID.
          </li>
        </ol>
      </section>
    </StaticInfoPage>
  );
}
