import type { Metadata } from 'next';
import StaticInfoPage from '@/components/StaticInfoPage';

export const metadata: Metadata = {
  title: 'Shipping Policy | Darshan Style Hub™',
  description: 'Shipping timelines, free shipping threshold, and delivery information for Darshan Style Hub.',
};

export default function ShippingPolicyPage() {
  return (
    <StaticInfoPage
      title="Shipping policy"
      description="We ship across India. Timelines below are estimates and may vary during sales or peak seasons."
    >
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Delivery</h2>
        <p>
          Orders are typically processed within 1–2 business days. Delivery time depends on your
          location and courier partner—most metro orders arrive within 3–7 business days after
          dispatch.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Free shipping</h2>
        <p>
          Free standard shipping applies on orders above ₹999 where mentioned on the site or at
          checkout. Below that threshold, shipping charges (if any) are shown before you pay.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Address &amp; delays</h2>
        <p>
          Please ensure your address and phone number are correct. We are not responsible for delays
          caused by incomplete addresses, weather, or courier disruptions—but we will help you track
          and resolve issues where possible.
        </p>
      </section>
    </StaticInfoPage>
  );
}
