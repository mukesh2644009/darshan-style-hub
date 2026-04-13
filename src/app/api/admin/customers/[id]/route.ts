import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Check if user is admin
async function isAdmin() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) return false;
  
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  
  return session?.user?.role === 'ADMIN';
}

// DELETE customer
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const customerId = params.id;

    // Check if customer exists
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      include: { orders: true },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Don't allow deleting admin users
    if (customer.role === 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete admin users' },
        { status: 400 }
      );
    }

    // Delete related data in order
    // 1. Delete sessions
    await prisma.session.deleteMany({
      where: { userId: customerId },
    });

    // 2. Delete addresses
    await prisma.address.deleteMany({
      where: { userId: customerId },
    });

    // 3. Delete order items for all orders
    const orderIds = customer.orders.map(o => o.id);
    if (orderIds.length > 0) {
      await prisma.orderItem.deleteMany({
        where: { orderId: { in: orderIds } },
      });

      // 4. Delete orders
      await prisma.order.deleteMany({
        where: { userId: customerId },
      });
    }

    // 5. Finally delete the user
    await prisma.user.delete({
      where: { id: customerId },
    });

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
