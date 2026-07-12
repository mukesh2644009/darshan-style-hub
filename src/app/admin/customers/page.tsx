import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FiUsers, FiMail, FiPhone, FiShoppingBag, FiAward } from 'react-icons/fi';
import DeleteCustomerButton from './DeleteCustomerButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCustomers(): Promise<any[]> {
  const customers = await (prisma as any).user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, total: true, status: true, paymentMethod: true, paymentStatus: true,
          shippingAddress: true, shippingCity: true, shippingState: true, shippingPincode: true,
        },
      },
    },
  });
  // Customers with active (non-cancelled) orders come first
  return customers.sort((a: any, b: any) => {
    const aHasOrder = a.orders.some((o: any) => o.status !== 'CANCELLED') ? 1 : 0;
    const bHasOrder = b.orders.some((o: any) => o.status !== 'CANCELLED') ? 1 : 0;
    return bHasOrder - aHasOrder;
  });
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-600 mt-1">View and manage your customers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">With Orders</p>
          <p className="text-2xl font-bold text-green-600">
            {customers.filter(c => c.orders.some((o: any) => o.status !== 'CANCELLED')).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-blue-600">
            {customers.reduce((sum, c) => sum + c.orders.filter((o: any) => o.status !== 'CANCELLED').length, 0)}
          </p>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-12 text-center">
            <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No customers yet</h3>
            <p className="text-gray-500">Customers will appear here when they create accounts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><FiAward className="w-3.5 h-3.5 text-amber-500" />Points</span>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => {
                  const activeOrders = customer.orders.filter((o: any) => o.status !== 'CANCELLED');
                  const hasActiveOrder = activeOrders.length > 0;
                  const totalSpent = activeOrders.reduce((sum: number, order: any) => sum + order.total, 0);
                  const lastOrder = customer.orders[0];
                  const defaultAddress = lastOrder?.shippingCity ? lastOrder : null;
                  
                  return (
                    <tr key={customer.id} className={`hover:bg-gray-50 ${hasActiveOrder ? 'border-l-4 border-l-green-500 bg-green-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                            {customer.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{customer.name || 'Unnamed'}</p>
                              {hasActiveOrder && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full">BUYER</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">ID: {customer.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiMail className="w-4 h-4" />
                            {customer.email?.endsWith('@darshan.local')
                              ? <span className="text-gray-400 italic">Guest (phone login)</span>
                              : customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FiPhone className="w-4 h-4" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FiShoppingBag className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{activeOrders.length}</span>
                          <span className="text-gray-500">orders</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">
                          ₹{totalSpent.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(customer as any).loyaltyPoints > 0 ? (
                          <Link href="/admin/loyalty" className="group flex items-center gap-1.5">
                            <span className="font-bold text-amber-600 group-hover:underline">
                              {(customer as any).loyaltyPoints.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-gray-400">pts</span>
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {defaultAddress ? (
                          <div className="text-sm text-gray-600 max-w-[200px]" title={[defaultAddress.shippingAddress, defaultAddress.shippingCity, defaultAddress.shippingState, defaultAddress.shippingPincode].filter(Boolean).join(', ')}>
                            {defaultAddress.shippingAddress && (
                              <p className="truncate text-gray-700">{defaultAddress.shippingAddress}</p>
                            )}
                            <p className="truncate">{defaultAddress.shippingCity}, {defaultAddress.shippingState}</p>
                            <p className="text-gray-400">{defaultAddress.shippingPincode}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No address</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          timeZone: 'Asia/Kolkata',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {customer.role !== 'ADMIN' && (() => {
                          const activeStatuses = ['SHIPPED', 'DELIVERED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURNED', 'EXCHANGE_REQUESTED', 'EXCHANGE_APPROVED', 'EXCHANGED'];
                          const hasActiveOrders = customer.orders.some((o: any) => activeStatuses.includes(o.status));
                          return (
                            <DeleteCustomerButton
                              customerId={customer.id}
                              customerName={customer.name || 'Unnamed'}
                              orderCount={customer.orders.length}
                              hasActiveOrders={hasActiveOrders}
                            />
                          );
                        })()}
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

