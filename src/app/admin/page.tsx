import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FiShoppingBag, FiPackage, FiUsers, FiDollarSign, FiTrendingUp, FiArrowRight } from 'react-icons/fi';

async function getStats() {
  const [ordersCount, productsCount, customersCount, orders] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.findMany({
      select: { total: true },
    }),
  ]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  return {
    ordersCount,
    productsCount,
    customersCount,
    totalRevenue,
  };
}

async function getRecentOrders() {
  return prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const recentOrders = await getRecentOrders();

  const statCards = [
    {
      name: 'Total Orders',
      value: stats.ordersCount,
      icon: FiShoppingBag,
      color: 'bg-blue-500',
      href: '/admin/orders',
    },
    {
      name: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      icon: FiDollarSign,
      color: 'bg-green-500',
      href: '/admin/orders',
    },
    {
      name: 'Products',
      value: stats.productsCount,
      icon: FiPackage,
      color: 'bg-purple-500',
      href: '/admin/products',
    },
    {
      name: 'Customers',
      value: stats.customersCount,
      icon: FiUsers,
      color: 'bg-orange-500',
      href: '/admin/customers',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <p className="text-sm text-gray-500 mt-1">Latest orders from your customers</p>
          </div>
          <Link
            href="/admin/orders"
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            View All <FiArrowRight />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <FiShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500">Orders will appear here once customers start purchasing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{order.user?.name || 'Guest'}</p>
                        <p className="text-sm text-gray-500">{order.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {order.items.length} item(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      ₹{order.total.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

