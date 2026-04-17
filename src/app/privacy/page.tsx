import type { Metadata } from 'next';
import StaticInfoPage from '@/components/StaticInfoPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | Darshan Style Hub™',
  description: 'How Darshan Style Hub collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <StaticInfoPage
      title="Privacy policy"
      description="This policy describes how we handle information when you use our website and services."
    >
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Information we collect</h2>
        <p>
          We may collect information you provide (name, email, phone, shipping address) when you
          register, place an order, or contact us. We also receive technical data such as browser type
          and pages visited to improve the site.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">How we use it</h2>
        <p>
          We use your information to process orders, communicate about your purchase, respond to
          requests, and improve our store. With your consent where required, we may send promotional
          updates you can opt out of anytime.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Payments &amp; security</h2>
        <p>
          Payments are processed through secure payment partners. We do not store your full card
          details on our servers. Please use a strong password for your account and do not share
          OTPs or login credentials.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
        <p>
          For privacy-related questions, email us at the address shown in the site footer or write to
          our business address listed on the contact page.
        </p>
      </section>
    </StaticInfoPage>
  );
}
