'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiLoader, FiSearch, FiShoppingBag, FiUser, FiLogOut, FiArrowLeft, FiExternalLink, FiPhone } from 'react-icons/fi';

interface OrderItem { id: string; quantity: number; price: number; size?: string; product: { name: string } | null; }
interface PosOrder {
  id: string; createdAt: string; total: number; paymentMethod: string;
  shippingName: string; shippingPhone: string; shippingAddress: string;
  items: OrderItem[];
}
interface StaffUser { id: string; name: string; role: string; }

export default function PosOrdersPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || (d.user.role !== 'STAFF' && d.user.role !== 'ADMIN')) {
        router.push('/pos/login');
      } else {
        setStaff(d.user);
      }
    }).catch(() => router.push('/pos/login'));
  }, [router]);

  useEffect(() => {
    fetch('/api/pos/orders/history')
      .then(r => r.json())
      .then(d => { if (d.success) setOrders(d.orders); })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/pos/login');
  }

  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.shippingName.toLowerCase().includes(q) ||
      o.shippingPhone.includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  });

  if (loading || !staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <FiLoader className="animate-spin w-10 h-10 text-rose-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/pos" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-600 transition-colors">
            <FiArrowLeft className="w-4 h-4" /> POS
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-base font-bold text-gray-900">Offline Orders</h1>
        </div>
        <p className="text-sm font-semibold text-rose-700 hidden sm:block">Darshan Style Hub — POS</p>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors">
          <FiLogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      <div className="flex-1 p-4 max-w-5xl mx-auto w-full">
        {/* Search */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer name, mobile, or order ID…"
            className="w-full pl-9 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-rose-400 shadow-sm"
          />
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Total Offline Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">
              ₹{orders.reduce((s, o) => s + o.total, 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 col-span-2 sm:col-span-1">
            <p className="text-xs text-gray-500">Unique Customers</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {new Set(orders.map(o => o.shippingPhone)).size}
            </p>
          </div>
        </div>

        {/* Orders list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center text-gray-400 shadow-sm">
            <FiShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{search ? 'No orders match your search' : 'No offline orders yet'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Customer info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                      <span className="text-rose-700 font-bold text-sm">{order.shippingName?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{order.shippingName}</p>
                      <a href={`tel:${order.shippingPhone}`}
                        className="flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700 mt-0.5">
                        <FiPhone className="w-3 h-3" /> {order.shippingPhone}
                      </a>
                      {order.shippingAddress && order.shippingAddress !== 'In-store purchase' && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{order.shippingAddress}</p>
                      )}
                    </div>
                  </div>

                  {/* Order meta */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900 text-lg">₹{order.total.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
                      })}
                    </p>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.paymentMethod.includes('UPI') ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                    }`}>
                      {order.paymentMethod.includes('UPI') ? '📱 UPI' : '💵 Cash'}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {order.items.map(item => (
                      <span key={item.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                        {item.product?.name ?? 'Product'}{item.size ? ` (${item.size})` : ''} × {item.quantity}
                      </span>
                    ))}
                  </div>
                  <Link href={`/pos/receipt/${order.id}`} target="_blank"
                    className="shrink-0 flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold">
                    <FiExternalLink className="w-3.5 h-3.5" /> Receipt
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
