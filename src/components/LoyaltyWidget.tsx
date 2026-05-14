'use client';

import { useEffect, useState } from 'react';
import { FiAward, FiGift, FiTrendingUp, FiClock } from 'react-icons/fi';

interface Transaction {
  id: string;
  points: number;
  type: string;
  description: string;
  orderId: string | null;
  createdAt: string;
}

interface LoyaltyData {
  points: number;
  transactions: Transaction[];
}

const TIER_CONFIG = [
  { name: 'Bronze', min: 0, max: 499, color: 'text-amber-700 bg-amber-50 border-amber-200', icon: '🥉' },
  { name: 'Silver', min: 500, max: 1499, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: '🥈' },
  { name: 'Gold', min: 1500, max: 2999, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: '🥇' },
  { name: 'Platinum', min: 3000, max: Infinity, color: 'text-purple-600 bg-purple-50 border-purple-200', icon: '💎' },
];

function getTier(points: number) {
  return TIER_CONFIG.find((t) => points >= t.min && points <= t.max) || TIER_CONFIG[0];
}

export default function LoyaltyWidget() {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/loyalty')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
        <div className="h-10 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-48" />
      </div>
    );
  }

  if (!data) return null;

  const tier = getTier(data.points);
  const nextTier = TIER_CONFIG.find((t) => t.min > data.points);
  const progressToNext = nextTier
    ? ((data.points - tier.min) / (nextTier.min - tier.min)) * 100
    : 100;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center">
            <FiAward size={20} className="text-primary-600" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-gray-900">Loyalty Rewards</h2>
            <p className="text-xs text-gray-500">Earn points on every order</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${tier.color}`}>
          {tier.icon} {tier.name}
        </span>
      </div>

      {/* Points balance */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-5 text-white">
        <p className="text-sm opacity-80 mb-1">Your Points Balance</p>
        <p className="text-4xl font-bold">{data.points.toLocaleString()}</p>
        <p className="text-sm opacity-70 mt-1">≈ ₹{Math.floor(data.points / 10).toLocaleString()} value</p>
      </div>

      {/* Progress to next tier */}
      {nextTier && (
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress to {nextTier.name}</span>
            <span className="font-medium text-gray-900">
              {nextTier.min - data.points} pts needed
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* How to earn */}
      <div className="bg-accent-50 rounded-xl p-4 space-y-2.5">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FiTrendingUp size={15} className="text-primary-600" />
          How to earn points
        </p>
        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <FiGift size={13} className="text-primary-500 shrink-0" />
            <span>1 point for every ₹10 spent on orders</span>
          </div>
          <div className="flex items-center gap-2">
            <FiGift size={13} className="text-primary-500 shrink-0" />
            <span>10 points bonus on your first prepaid order</span>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      {data.transactions.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FiClock size={14} className="text-gray-400" />
            Recent Activity
          </p>
          <div className="space-y-2">
            {data.transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm text-gray-900">{tx.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`text-sm font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.points > 0 ? '+' : ''}{tx.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.transactions.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-2">
          No transactions yet. Place an order to start earning!
        </p>
      )}
    </div>
  );
}
