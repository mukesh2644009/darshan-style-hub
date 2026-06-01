'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiPrinter, FiArrowLeft, FiLoader } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

interface OrderItem {
  id: string; quantity: number; price: number; size?: string;
  product: { name: string; sku: string; };
}
interface Order {
  id: string; createdAt: string; total: number; subtotal: number;
  paymentMethod: string; shippingName: string; shippingPhone: string;
  shippingAddress?: string; shippingCity?: string; items: OrderItem[];
}

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/pos/orders?id=${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setOrder(d.order); })
      .finally(() => setLoading(false));
  }, [id]);

  // Auto-open print dialog once receipt loads
  useEffect(() => {
    if (order) {
      const timer = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timer);
    }
  }, [order]);

  function handlePrint() {
    window.print();
  }

  function handleWhatsApp() {
    if (!order) return;
    const lines = [
      `🧾 *DARSHAN STYLE HUB™*`,
      `_Art in Every Thread_`,
      ``,
      `Order: *DSH-POS-${order.id.slice(-6).toUpperCase()}*`,
      `Date: ${new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      ``,
      `*Customer:* ${order.shippingName}`,
      ``,
      `*Items:*`,
      ...order.items.map(i => `• ${i.product.name}${i.size ? ` (${i.size})` : ''} × ${i.quantity} = ₹${(i.price * i.quantity).toLocaleString('en-IN')}`),
      ``,
      `*Total: ₹${order.total.toLocaleString('en-IN')}*`,
      `Payment: ${order.paymentMethod}`,
      ``,
      `Thank you for shopping with Darshan Style Hub! 🙏`,
      `www.darshanstylehub.com`,
    ].join('\n');

    const phone = order.shippingPhone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('91') ? phone : `91${phone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(lines)}`, '_blank');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <FiLoader className="animate-spin w-10 h-10 text-rose-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 gap-4">
        <p className="text-gray-500">Receipt not found</p>
        <button onClick={() => router.push('/pos')} className="px-4 py-2 bg-rose-600 text-white rounded-xl">← Back to POS</button>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Action buttons — hidden in print */}
      <div className="max-w-sm mx-auto mb-4 flex gap-3 print:hidden">
        <button onClick={() => router.push('/pos')}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
          <FiArrowLeft className="w-4 h-4" /> New Sale
        </button>
        <button onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors">
          <FaWhatsapp className="w-4 h-4" /> WhatsApp
        </button>
        <button onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-colors">
          <FiPrinter className="w-4 h-4" /> Print
        </button>
      </div>

      {/* Receipt */}
      <div ref={receiptRef}
        className="max-w-sm mx-auto bg-white rounded-2xl shadow-sm overflow-hidden print:shadow-none print:rounded-none print:max-w-full">
        {/* Header */}
        <div className="bg-rose-700 text-white text-center py-5 px-4">
          <h1 className="text-xl font-bold tracking-wide">DARSHAN STYLE HUB™</h1>
          <p className="text-rose-200 text-xs italic mt-0.5">Art in Every Thread</p>
          <p className="text-rose-100 text-xs mt-2">+91 90190 76335 · darshanstylehub.com</p>
          <p className="text-rose-200 text-xs">Sitapura Industrial Area, Jaipur 302022</p>
        </div>

        <div className="p-5 space-y-4 font-mono text-sm">
          {/* Order info */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>Order #</span>
            <span className="font-bold text-gray-800">DSH-POS-{order.id.slice(-6).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Date</span>
            <span className="text-gray-800">{orderDate}</span>
          </div>

          <div className="border-t border-dashed border-gray-300" />

          {/* Customer */}
          <div className="space-y-1 text-xs">
            <p className="text-gray-500 uppercase tracking-widest text-[10px]">Customer</p>
            <p className="font-bold text-gray-900">{order.shippingName}</p>
            <p className="text-gray-600">{order.shippingPhone}</p>
            {order.shippingAddress && order.shippingAddress !== 'In-store purchase' && (
              <p className="text-gray-600">{order.shippingAddress}</p>
            )}
          </div>

          <div className="border-t border-dashed border-gray-300" />

          {/* Items */}
          <div className="space-y-2">
            <p className="text-gray-500 uppercase tracking-widest text-[10px]">Items</p>
            {order.items.map(item => (
              <div key={item.id} className="space-y-0.5">
                <p className="text-gray-900 font-medium leading-tight text-xs">{item.product.name}{item.size && ` (${item.size})`}</p>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>₹{item.price.toLocaleString('en-IN')} × {item.quantity}</span>
                  <span className="font-semibold text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-gray-900" />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900 text-base">TOTAL</span>
            <span className="font-bold text-gray-900 text-xl">₹{order.total.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Payment</span>
            <span className="font-medium text-gray-700">{order.paymentMethod}</span>
          </div>

          <div className="border-t border-dashed border-gray-300" />

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 space-y-1 pb-2">
            <p className="text-gray-600 font-semibold">Thank you for shopping with us! 🙏</p>
            <p>Easy returns within 7 days</p>
            <p>www.darshanstylehub.com</p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
