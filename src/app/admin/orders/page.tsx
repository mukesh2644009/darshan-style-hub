import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FiEye, FiShoppingBag, FiPackage, FiTruck, FiCheckCircle, FiClock, FiRotateCcw, FiAlertCircle } from 'react-icons/fi';
import QuickOrderActions from './QuickOrderActions';
import DeleteOrderButton from './DeleteOrderButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      items: { include: { product: true } },
    },
  });
}

const STATUS_META: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  PENDING:            { label: 'Pending',            dot: 'bg-yellow-400', bg: 'bg-yellow-50',  text: 'text-yellow-800'  },
  CONFIRMED:          { label: 'Confirmed',          dot: 'bg-blue-500',   bg: 'bg-blue-50',    text: 'text-blue-800'    },
  SHIPPED:            { label: 'Shipped',            dot: 'bg-purple-500', bg: 'bg-purple-50',  text: 'text-purple-800'  },
  DELIVERED:          { label: 'Delivered',          dot: 'bg-green-500',  bg: 'bg-green-50',   text: 'text-green-800'   },
  CANCELLED:          { label: 'Cancelled',          dot: 'bg-red-400',    bg: 'bg-red-50',     text: 'text-red-700'     },
  RETURN_REQUESTED:   { label: 'Return Requested',   dot: 'bg-orange-400', bg: 'bg-orange-50',  text: 'text-orange-800'  },
  RETURN_APPROVED:    { label: 'Return Approved',    dot: 'bg-orange-500', bg: 'bg-orange-100', text: 'text-orange-900'  },
  RETURNED:           { label: 'Returned',           dot: 'bg-gray-400',   bg: 'bg-gray-100',   text: 'text-gray-700'    },
  EXCHANGE_REQUESTED: { label: 'Exchange Requested', dot: 'bg-sky-400',    bg: 'bg-sky-50',     text: 'text-sky-800'     },
  EXCHANGE_APPROVED:  { label: 'Exchange Approved',  dot: 'bg-sky-500',    bg: 'bg-sky-100',    text: 'text-sky-900'     },
  EXCHANGED:          { label: 'Exchanged',          dot: 'bg-teal-500',   bg: 'bg-teal-50',    text: 'text-teal-800'    },
};

const PAYMENT_META: Record<string, { label: string; bg: string; text: string }> = {
  PAID:     { label: 'Paid',     bg: 'bg-green-100', text: 'text-green-800' },
  PENDING:  { label: 'Pending',  bg: 'bg-yellow-100',text: 'text-yellow-800'},
  FAILED:   { label: 'Failed',   bg: 'bg-red-100',   text: 'text-red-700'   },
  REFUNDED: { label: 'Refunded', bg: 'bg-gray-200',  text: 'text-gray-700'  },
};

export default async function OrdersPage() {
  const orders = await getOrders();

  const total   = orders.length;
  const pending = orders.filter(o => o.status === 'PENDING').length;
  const shipped = orders.filter(o => o.status === 'SHIPPED').length;
  const delivered = orders.filter(o => o.status === 'DELIVERED').length;
  const returns = orders.filter(o => ['RETURN_REQUESTED','EXCHANGE_REQUESTED'].includes(o.status)).length;
  const revenue = orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0);

  const stats = [
    { label: 'Total Orders', value: total,   icon: FiShoppingBag,  color: 'from-primary-500 to-primary-600' },
    { label: 'Pending',      value: pending, icon: FiClock,        color: 'from-yellow-400 to-yellow-500'   },
    { label: 'Shipped',      value: shipped, icon: FiTruck,        color: 'from-purple-500 to-purple-600'   },
    { label: 'Delivered',    value: delivered,icon: FiCheckCircle, color: 'from-green-500 to-green-600'     },
    { label: 'Returns',      value: returns, icon: FiRotateCcw,    color: 'from-orange-400 to-orange-500'   },
    { label: 'Revenue',      value: `₹${revenue.toLocaleString('en-IN')}`, icon: FiPackage, color: 'from-teal-500 to-teal-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Manage and track all customer orders</p>
        </div>
        <Link href="/admin/returns" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors text-sm font-medium">
          <FiRotateCcw className="w-4 h-4" />
          {returns > 0 && <span className="w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{returns}</span>}
          Returns
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders yet</h3>
            <p className="text-gray-500 text-sm">Orders will appear here once customers start purchasing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Order', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const sm = STATUS_META[order.status] ?? STATUS_META['PENDING'];
                  const pm = PAYMENT_META[order.paymentStatus] ?? PAYMENT_META['PENDING'];
                  const isReturnFlow = ['RETURN_REQUESTED','EXCHANGE_REQUESTED'].includes(order.status);

                  return (
                    <tr key={order.id} className={`hover:bg-gray-50/80 transition-colors ${isReturnFlow ? 'bg-orange-50/30' : ''}`}>
                      {/* Order ID */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {isReturnFlow && <FiAlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                          <span className="font-mono text-sm font-bold text-gray-800">#{order.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{order.paymentMethod}</p>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900 text-sm">{order.shippingName || order.user?.name || 'Guest'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{order.shippingPhone || order.user?.phone}</p>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-4 max-w-[180px]">
                        {order.items.slice(0, 2).map((item, i) => (
                          <p key={i} className="text-xs text-gray-600 truncate leading-relaxed">{item.product?.name} ×{item.quantity}</p>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-xs text-gray-400">+{order.items.length - 2} more</p>
                        )}
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900">₹{order.total.toLocaleString('en-IN')}</span>
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${pm.bg} ${pm.text}`}>
                          {pm.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sm.bg} ${sm.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                          {sm.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
                        })}
                        <br />
                        <span className="text-gray-400">
                          {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-100 rounded-lg hover:bg-primary-100 transition-colors text-xs font-semibold"
                          >
                            <FiEye className="w-3.5 h-3.5" /> View
                          </Link>
                          <QuickOrderActions orderId={order.id} currentStatus={order.status} />
                          <DeleteOrderButton orderId={order.id} orderRef={order.id.slice(0, 8).toUpperCase()} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
