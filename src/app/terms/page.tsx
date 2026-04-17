import type { Metadata } from 'next';
import Link from 'next/link';
import StaticInfoPage from '@/components/StaticInfoPage';

export const metadata: Metadata = {
  title: 'Terms of Service | Darshan Style Hub™',
  description: 'Terms and conditions for using the Darshan Style Hub website and purchasing products.',
};

export default function TermsPage() {
  return (
    <StaticInfoPage
      title="Terms of service"
      description="By using this website and placing an order, you agree to the following terms."
    >
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Orders &amp; pricing</h2>
        <p>
          All orders are subject to acceptance and availability. Prices and offers may change
          without notice before checkout is completed. We reserve the right to cancel orders in case
          of pricing errors, stock issues, or suspected fraud.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Products</h2>
        <p>
          We try to display colours and details accurately; slight variations may occur due to
          screens and photography. Measurements and fit may vary slightly by style—refer to product
          descriptions and our{' '}
          <Link href="/size-guide" className="text-primary-600 hover:text-primary-700 font-medium">
            size guide
          </Link>
          .
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Returns &amp; liability</h2>
        <p>
          Returns and exchanges are governed by our{' '}
          <Link href="/returns" className="text-primary-600 hover:text-primary-700 font-medium">
            returns policy
          </Link>
          . To the extent permitted by law, our liability is limited to the amount you paid for the
          relevant product.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Governing law</h2>
        <p>
          These terms are governed by the laws applicable in India. Disputes shall be subject to the
          courts at Jaipur, Rajasthan, where our business operates.
        </p>
      </section>
    </StaticInfoPage>
  );
}
