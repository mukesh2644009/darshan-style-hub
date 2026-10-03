import { marketplaceCategoryFor } from '@/lib/marketplaceCategories';

// "Upload as: Flipkart → … · Myntra → …" for a site category.
export default function MarketplaceCategoryHint({
  category,
  only,
}: {
  category: string;
  only?: 'flipkart' | 'myntra';
}) {
  const m = marketplaceCategoryFor(category);
  const item = (label: string, value: string, color: string) => (
    <span className="inline-flex items-center gap-1">
      <span className={`font-semibold ${color}`}>{label}:</span>
      {value ? <span className="text-gray-800">{value}</span> : <span className="text-gray-400 italic">not set up yet</span>}
    </span>
  );
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
      <span className="text-gray-500">Upload as</span>
      {only !== 'myntra' && item('Flipkart', m.flipkart, 'text-[#2874f0]')}
      {only !== 'flipkart' && item('Myntra', m.myntra, 'text-[#ff3f6c]')}
    </div>
  );
}
