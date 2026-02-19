import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import ProductAddForm from './ProductAddForm';

export default function AddProductPage() {
  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-600 mt-1">Create a new product for your catalog</p>
      </div>

      <ProductAddForm />
    </div>
  );
}
