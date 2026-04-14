import { prisma } from '@/lib/prisma';
import AdminReturnsDashboard from './AdminReturnsDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminReturnsPage() {
  const returns = await prisma.returnRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      order: {
        select: {
          id: true,
          status: true,
          total: true,
          paymentMethod: true,
          paymentStatus: true,
          razorpayPaymentId: true,
          razorpayRefundId: true,
          shippingName: true,
          shippingPhone: true,
          createdAt: true,
        },
      },
    },
  });

  const initialReturns = JSON.parse(JSON.stringify(returns));

  return <AdminReturnsDashboard initialReturns={initialReturns} />;
}
