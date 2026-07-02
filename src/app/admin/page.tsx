import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  FiShoppingBag, FiPackage, FiUsers, FiDollarSign,
  FiArrowRight, FiTrendingUp, FiRotateCcw, FiClock,
} from 'react-icons/fi';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_META: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  PENDING:            { label: 'Pending',            dot: 'bg-yellow-400', bg: 'bg-yellow-50',  text: 'text-yellow-800' },
  CONFIRMED:          { label: 'Confirmed',          dot: 'bg-blue-500',   bg: 'bg-blue-50',    text: 'text-blue-800'   },
  SHIPPED:            { label: 'Shipped',            dot: 'bg-purple-500', bg: 'bg-purple-50',  text: 'text-purple-800' },
  DELIVERED:          { label: 'Delivered',          dot: 'bg-green-500',  bg: 'bg-green-50',   text: 'text-green-800'  },
  CANCELLED:          { label: 'Cancelled',          dot: 'bg-red-400',    bg: 'bg-red-50',     text: 'text-red-700'    },
  RETURN_REQUESTED:   { label: 'Return Requested',   dot: 'bg-orange-400', bg: 'bg-orange-50',  text: 'text-orange-800' },
  RETURN_APPROVED:    { label: 'Return Approved',    dot: 'bg-orange-500', bg: 'bg-orange-100', text: 'text-orange-900' },
  RETURNED:           { label: 'Returned',           dot: 'bg-gray-400',   bg: 'bg-gray-100',   text: 'text-gray-700'   },
  EXCHANGE_REQUESTED: { label: 'Exchange Requested', dot: 'bg-sky-400',    bg: 'bg-sky-50',     text: 'text-sky-800'    },
  EXCHANGE_APPROVED:  { label: 'Exchange Approved',  dot: 'bg-sky-500',    bg: 'bg-sky-100',    text: 'text-sky-900'    },
  EXCHANGED:          { label: 'Exchanged',          dot: 'bg-teal-500',   bg: 'bg-teal-50',    text: 'text-teal-800'   },
};

async function getData() {
  const [orders, productsCount, customersCount, allProducts, pendingReturns] = await Promise.all([
    prisma.order.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { user: true, items: { include: { product: true } } },
    }),
    prisma.product.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.findMany({ select: { category: true } }),
    prisma.returnRequest.count({ where: { status: 'PENDING' } }),
  ]);

  // Dynamic category counts
  const categoryCounts: Record<string, number> = {};
  for (const p of allProducts) {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  }

  const allOrders = await prisma.order.findMany({ select: { total: true, status: true, createdAt: true } });
  const revenue = allOrders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0);
  const pending = allOrders.filter(o => o.status === 'PENDING').length;

  return { orders, productsCount, customersCount, revenue, categoryCounts, pendingReturns, pending, totalOrders: allOrders.length };
}

export default async function AdminDashboard() {
  const d = await getData();

  const categoryEntries = Object.entries(d.categoryCounts).sort((a, b) => b[1] - a[1]);
  const categoryIcons: Record<string, string> = {
    'Suits': '👗', 'Co Ord Sets': '👚', 'Sarees': '🥻', 'Kurtis': '👘',
    'Summer Co-ord Set with Shorts': '🩳', 'Lehengas': '👰', 'Tops': '👕',
  };
  const categoryColors: Record<string, { bg: string; text: string; icon: string; hover: string }> = {
    'Suits':       { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'text-purple-500', hover: 'group-hover:text-purple-500' },
    'Co Ord Sets': { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'text-orange-500', hover: 'group-hover:text-orange-500' },
    'Sarees':      { bg: 'bg-pink-100',   text: 'text-pink-700',   icon: 'text-pink-500',   hover: 'group-hover:text-pink-500'   },
    'Kurtis':      { bg: 'bg-green-100',  text: 'text-green-700',  icon: 'text-green-500',  hover: 'group-hover:text-green-500'  },
  };
  const defaultColor = { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'text-blue-500', hover: 'group-hover:text-blue-500' };

  const stats = [
    { label: 'Total Orders',   value: d.totalOrders,           sub: `${d.pending} pending`,  icon: FiShoppingBag, color: 'from-primary-500 to-primary-700', href: '/admin/orders'   },
    { label: 'Revenue',        value: `₹${d.revenue.toLocaleString('en-IN')}`, sub: 'all time', icon: FiDollarSign,  color: 'from-green-500 to-green-700',   href: '/admin/orders'   },
    { label: 'Products',       value: d.productsCount,         sub: categoryEntries.slice(0,2).map(([c,n]) => `${n} ${c.toLowerCase()}`).join(' · ') || 'none yet', icon: FiPackage, color: 'from-purple-500 to-purple-700', href: '/admin/products' },
    { label: 'Customers',      value: d.customersCount,        sub: 'registered',            icon: FiUsers,       color: 'from-blue-500 to-blue-700',     href: '/admin/customers' },
    { label: 'Pending Returns',value: d.pendingReturns,        sub: 'awaiting action',       icon: FiRotateCcw,   color: 'from-orange-400 to-orange-600', href: '/admin/returns'   },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-0.5 text-sm">Welcome back! Here&apos;s your store at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(({ label, value, sub, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all group">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      {d.pendingReturns > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <FiRotateCcw className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-orange-900 text-sm">{d.pendingReturns} return request{d.pendingReturns > 1 ? 's' : ''} need your attention</p>
              <p className="text-xs text-orange-600">Review and approve or reject pending returns</p>
            </div>
          </div>
          <Link href="/admin/returns" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 transition-colors">
            Review Now <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiClock className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            View all <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {d.orders.length === 0 ? (
          <div className="p-12 text-center">
            <FiShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {d.orders.map(order => {
                const sm = STATUS_META[order.status] ?? STATUS_META['PENDING'];
                return (
                  <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-sm font-bold text-primary-600 hover:text-primary-700">
                        DSH{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-900">{order.shippingName || order.user?.name || 'Guest'}</p>
                      <p className="text-xs text-gray-400">{order.shippingPhone || order.user?.phone}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-gray-900">₹{order.total.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sm.bg} ${sm.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                        {sm.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Category cards — dynamic */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryEntries.map(([cat, count]) => {
          const col = categoryColors[cat] || defaultColor;
          const icon = categoryIcons[cat] || '🛍️';
          return (
            <Link key={cat} href={`/admin/products?category=${encodeURIComponent(cat)}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all flex items-center gap-4 group">
              <div className={`w-14 h-14 ${col.bg} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                <span className="text-2xl">{icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium truncate">{cat}</p>
                <p className={`text-3xl font-bold ${col.text}`}>{count}</p>
                <p className="text-xs text-gray-400">products listed</p>
              </div>
              <FiTrendingUp className={`w-4 h-4 text-gray-300 ml-auto shrink-0 ${col.hover} transition-colors`} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
