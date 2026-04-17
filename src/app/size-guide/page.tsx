import type { Metadata } from 'next';
import StaticInfoPage from '@/components/StaticInfoPage';

export const metadata: Metadata = {
  title: 'Size Guide | Darshan Style Hub™',
  description: 'How to choose the right size for suits, co ord sets, and ethnic wear at Darshan Style Hub.',
};

export default function SizeGuidePage() {
  return (
    <StaticInfoPage
      title="Size guide"
      description="Use these tips along with the size chart on each product page when available."
    >
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">How to measure</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Bust</strong> — fullest part of the chest, keeping the tape level.
          </li>
          <li>
            <strong>Waist</strong> — natural waistline, usually above the belly button.
          </li>
          <li>
            <strong>Hips</strong> — fullest part of the hips.
          </li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Between sizes?</h2>
        <p>
          If you are between two sizes, check whether the garment is meant to be relaxed or fitted.
          For fitted styles, consider sizing up; for relaxed cuts, your usual size may work best.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Still unsure?</h2>
        <p>
          Message us on WhatsApp with your measurements—we are happy to suggest a size before you
          place your order.
        </p>
      </section>
    </StaticInfoPage>
  );
}
