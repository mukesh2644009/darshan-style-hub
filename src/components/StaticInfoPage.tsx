import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

interface StaticInfoPageProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function StaticInfoPage({ title, description, children }: StaticInfoPageProps) {
  return (
    <div className="min-h-screen bg-accent-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <FiArrowLeft />
          Back to shop
        </Link>

        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">{title}</h1>
          {description && <p className="text-gray-600">{description}</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6 text-gray-700 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
