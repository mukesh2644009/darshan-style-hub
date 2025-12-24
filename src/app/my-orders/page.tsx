'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiPackage, FiShoppingBag, FiLoader, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  size: string;
  color: string;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/my-orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const res = await fetch(`/api/my-orders/${orderId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <FiArrowLeft />
            Back to Shop
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-1">Welcome, {user?.name}</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FiShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">Start shopping to place your first order!</p>
            <Link href="/products" className="btn-primary inline-flex items-center gap-2">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      <p className="font-mono font-medium text-gray-900">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FiPackage className="text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{item.product.name}</p>
                            <p className="text-sm text-gray-500">
                              {item.size && `Size: ${item.size}`}
                              {item.size && item.color && ' | '}
                              {item.color && `Color: ${item.color}`}
                              {' | '}Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="font-medium text-gray-900">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        Ordered on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-gray-900">
                        Total: ₹{order.total.toLocaleString('en-IN')}
                      </p>
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

