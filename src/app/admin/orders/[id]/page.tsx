import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { FiArrowLeft, FiPackage, FiMapPin, FiPhone, FiUser, FiCalendar, FiExternalLink, FiTruck } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import OrderStatusUpdater from './OrderStatusUpdater';

async function getOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
        },
      },
    },
  });
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id);

  if (!order) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED':          return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPPED':            return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED':          return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':          return 'bg-red-100 text-red-800 border-red-200';
      case 'RETURN_REQUESTED':   return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'RETURN_APPROVED':    return 'bg-orange-200 text-orange-900 border-orange-300';
      case 'RETURNED':           return 'bg-gray-200 text-gray-700 border-gray-300';
      case 'EXCHANGE_REQUESTED': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'EXCHANGE_APPROVED':  return 'bg-sky-200 text-sky-900 border-sky-300';
      case 'EXCHANGED':          return 'bg-teal-100 text-teal-800 border-teal-200';
      default:                   return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const whatsappMessage = `Hi! Regarding your order DSH${order.id.slice(0, 8).toUpperCase()} at Darshan Style Hub:\n\nOrder Total: ₹${order.total.toLocaleString('en-IN')}\nStatus: ${order.status}\n\nHow can we help you?`;
  const whatsappLink = `https://wa.me/${order.shippingPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  // Detect mismatch between store status and Nimbuspost status
  const nimbusStatusUpper = (order.nimbusStatus || '').toUpperCase();
  const nimbusSaysCancelled = nimbusStatusUpper === 'CANCELLED' || nimbusStatusUpper === 'SHIPMENT_CANCELLED';
  const nimbusSaysDelivered = nimbusStatusUpper === 'DELIVERED';
  const nimbusSaysRTO = nimbusStatusUpper.includes('RTO');
  const statusMismatch =
    (nimbusSaysCancelled && order.status !== 'CANCELLED') ||
    (nimbusSaysDelivered && order.status !== 'DELIVERED') ||
    (nimbusSaysRTO && !['RETURNED', 'RETURN_APPROVED', 'CANCELLED'].includes(order.status));

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          Back to Orders
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Order DSH{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-gray-600 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Kolkata',
              })}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Nimbus ↔ Store status mismatch warning */}
      {statusMismatch && order.nimbusStatus && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-300 rounded-xl px-5 py-4">
          <span className="text-2xl shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="font-bold text-red-800">Status Mismatch — Action Required</p>
            <p className="text-sm text-red-700 mt-1">
              Nimbuspost shows this shipment as <strong>{order.nimbusStatus}</strong>, but this store
              still shows the order as <strong>{order.status}</strong>.
            </p>
            <p className="text-sm text-red-600 mt-1">
              Please update the order status below to match the actual shipment state.
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiPackage />
                Order Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="p-6 flex gap-4">
                  {/* Images: main + thumbnails */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <div className="relative w-24 h-28 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      {item.product?.images[0] ? (
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product?.name || 'Product'}
                          fill
                          className="object-cover object-top"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FiPackage className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    {/* Extra thumbnails */}
                    {item.product?.images && item.product.images.length > 1 && (
                      <div className="flex gap-1">
                        {item.product.images.slice(1, 4).map((img, idx) => (
                          <div key={idx} className="relative w-7 h-8 rounded overflow-hidden border border-gray-200 bg-gray-100">
                            <Image
                              src={img.url}
                              alt=""
                              fill
                              className="object-cover object-top"
                              unoptimized
                            />
                          </div>
                        ))}
                        {item.product.images.length > 4 && (
                          <div className="w-7 h-8 rounded bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 font-semibold border border-gray-200">
                            +{item.product.images.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.product?.name || 'Product'}</h3>
                    <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                      {item.size && item.size !== 'Free Size' && <p>Size: {item.size}</p>}
                      {item.color && <p>Color: {item.color}</p>}
                      <p>Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{item.price.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-gray-500">× {item.quantity}</p>
                    <p className="text-sm font-medium text-gray-700 mt-1">
                      = ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* Order Total */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">₹{order.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">
                    {order.shipping === 0 ? 'FREE' : `₹${order.shipping.toLocaleString('en-IN')}`}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600">-₹{order.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>₹{order.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Update Status */}
          <OrderStatusUpdater orderId={order.id} currentStatus={order.status} currentPaymentStatus={order.paymentStatus} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiUser />
              Customer
            </h2>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">{order.shippingName || order.user?.name}</p>
                {order.user?.email && !order.user.email.endsWith('@darshan.local') && (
                  <p className="text-sm text-gray-500">{order.user.email}</p>
                )}
              </div>
              {order.shippingPhone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FiPhone className="w-4 h-4" />
                  <span>{order.shippingPhone}</span>
                </div>
              )}
              {order.shippingPhone && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors w-full justify-center"
                >
                  <FaWhatsapp className="w-5 h-5" />
                  Contact on WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiMapPin />
              Shipping Address
            </h2>
            <div className="text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">{order.shippingName}</p>
              <p>{order.shippingAddress}</p>
              <p>{order.shippingCity}, {order.shippingState}</p>
              <p>PIN: {order.shippingPincode}</p>
              <p className="pt-2">
                <FiPhone className="inline w-4 h-4 mr-1" />
                {order.shippingPhone}
              </p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="font-medium">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                  order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Shipment Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiTruck />
              Shipment
            </h2>
            {order.shippingPartner ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Partner</span>
                  <span className="font-medium">{order.shippingPartner}</span>
                </div>
                {order.awbNumber && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">AWB</span>
                    <span className="font-mono text-xs font-semibold">{order.awbNumber}</span>
                  </div>
                )}
                {order.courierName && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Courier</span>
                    <span className="font-medium">{order.courierName}</span>
                  </div>
                )}
                {order.nimbusStatus && (
                  <div className={`flex justify-between gap-4 rounded-lg px-2 py-1 -mx-2 ${statusMismatch ? 'bg-red-50' : ''}`}>
                    <span className={statusMismatch ? 'text-red-700 font-semibold' : 'text-gray-600'}>
                      Nimbus Status
                    </span>
                    <span className={`font-semibold ${statusMismatch ? 'text-red-700' : 'text-gray-800'}`}>
                      {order.nimbusStatus}
                      {statusMismatch && ' ⚠️'}
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
                    >
                      <FiExternalLink className="w-3.5 h-3.5" />
                      Track
                    </a>
                  )}
                  {order.labelUrl && (
                    <a
                      href={order.labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                    >
                      <FiExternalLink className="w-3.5 h-3.5" />
                      Label
                    </a>
                  )}
                  {/* Invoice / Packing Slip */}
                  <a
                    href={`/api/admin/orders/invoice?orderId=${order.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    <FiExternalLink className="w-3.5 h-3.5" />
                    Print Invoice
                  </a>
                </div>

                {/* Reverse pickup info */}
                {(order as any).reverseAwb && (
                  <div className="mt-3 pt-3 border-t border-orange-100 bg-orange-50 rounded-lg p-3 space-y-1.5">
                    <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">Reverse Pickup</p>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-orange-600">Return AWB</span>
                      <span className="font-mono text-xs font-semibold text-orange-800">{(order as any).reverseAwb}</span>
                    </div>
                    {(order as any).reverseLabelUrl && (
                      <a
                        href={(order as any).reverseLabelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 transition-colors mt-1"
                      >
                        <FiExternalLink className="w-3.5 h-3.5" />
                        Return Label
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Shipment not created yet.</p>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiCalendar />
              Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                <div>
                  <p className="font-medium text-gray-900">Order Placed</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Kolkata',
                    })}
                  </p>
                </div>
              </div>
              {order.updatedAt !== order.createdAt && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="font-medium text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.updatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Kolkata',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

