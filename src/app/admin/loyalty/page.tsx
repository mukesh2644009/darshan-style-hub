import { prisma } from '@/lib/prisma';
import { FiAward } from 'react-icons/fi';
import LoyaltyManager from './LoyaltyManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getLoyaltyUsers() {
  const users = await (prisma as any).user.findMany({
    orderBy: [{ loyaltyPoints: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      loyaltyPoints: true,
      createdAt: true,
      _count: { select: { loyaltyTransactions: true } },
      loyaltyTransactions: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          points: true,
          type: true,
          description: true,
          createdAt: true,
        },
      },
    },
  });
  return users;
}

export default async function LoyaltyPage() {
  const users = await getLoyaltyUsers();

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FiAward className="w-7 h-7 text-amber-500" />
            Loyalty Points
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            View, add, subtract or set loyalty points for any customer. Delete individual transactions to reverse them.
          </p>
        </div>
        <div className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-right shrink-0">
          <p className="font-semibold text-gray-600 mb-0.5">Redemption rate</p>
          <p>10 pts = ₹1 discount</p>
          <p className="mt-1 font-semibold text-gray-600 mb-0.5">Tier thresholds</p>
          <p>Bronze · Silver (100) · Gold (500) · Platinum (2 000)</p>
        </div>
      </div>

      <LoyaltyManager initialUsers={users} />
    </div>
  );
}
