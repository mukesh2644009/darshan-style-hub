'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiPackage, FiShoppingBag, FiLoader, FiArrowLeft, FiTrash2, FiDownload, FiRotateCcw } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import { downloadReceipt } from '@/lib/generate-receipt';
import ReturnRequestModal from '@/components/ReturnRequestModal';
import { RETURN_REASONS } from '@/lib/return-reasons';

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
  paymentMethod: string;
  total: number;
  createdAt: string;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  items: OrderItem[];
  returnRequest?: {
    id: string;
    status: string;
    reason: string;
    createdAt: string;
  } | null;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);

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

  const handleDownloadReceipt = (order: Order) => {
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= 999 ? 0 : 99;
    const codCharge = order.paymentMethod === 'COD' ? 10 : 0;
    const nameParts = order.shippingName.split(' ');

    downloadReceipt({
      orderId: order.id,
      orderDate: new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      customerName: order.shippingName,
      customerEmail: order.shippingEmail,
      customerPhone: order.shippingPhone,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingPincode: order.shippingPincode,
      paymentMethod: order.paymentMethod || 'N/A',
      paymentStatus: order.paymentStatus || 'Pending',
      items: order.items.map(item => ({
        name: item.product.name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal,
      shipping,
      codCharge,
      total: order.total,
    });
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

  const getReturnStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-900';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const returnReasonLabel = (code: string) =>
    RETURN_REASONS.find((r) => r.value === code)?.label ?? code;

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
          <p className="text-gray-600 mt-1">
            Welcome, {user?.name}
            <span className="text-gray-400"> · </span>
            <Link href="/returns" className="text-primary-600 hover:text-primary-700 underline-offset-2 hover:underline">
              Returns & exchange policy
            </Link>
          </p>
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
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
                      <p className="text-lg font-bold text-gray-900 w-full sm:w-auto text-right sm:text-left">
                        Total: ₹{order.total.toLocaleString('en-IN')}
                      </p>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadReceipt(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-sm"
                        >
                          <FiDownload className="w-4 h-4" />
                          Receipt
                        </button>
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => cancelOrder(order.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            Cancel
                          </button>
                        )}
                        {order.status === 'DELIVERED' && !order.returnRequest && (
                          <button
                            type="button"
                            onClick={() => setReturnModalOrder(order)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-900 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium"
                          >
                            <FiRotateCcw className="w-4 h-4" />
                            Request return
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {order.returnRequest && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-sm text-gray-600">
                        Return: <span className="font-medium text-gray-900">{returnReasonLabel(order.returnRequest.reason)}</span>
                      </p>
                      <span
                        className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-medium ${getReturnStatusStyle(order.returnRequest.status)}`}
                      >
                        Return · {order.returnRequest.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {returnModalOrder && (
        <ReturnRequestModal
          order={returnModalOrder}
          onClose={() => setReturnModalOrder(null)}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
}

