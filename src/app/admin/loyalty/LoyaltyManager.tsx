'use client';

import { useState, useTransition } from 'react';
import {
  FiPlus, FiMinus, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp,
  FiAward, FiLoader, FiX, FiCheck, FiClock,
} from 'react-icons/fi';

interface Transaction {
  id: string;
  points: number;
  type: string;
  description: string;
  createdAt: string;
}

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  loyaltyPoints: number;
  _count: { loyaltyTransactions: number };
  loyaltyTransactions: Transaction[];
}

const TIER_LABEL: Record<string, { label: string; color: string }> = {
  Bronze:   { label: 'Bronze',   color: 'text-amber-700 bg-amber-50 border-amber-200' },
  Silver:   { label: 'Silver',   color: 'text-slate-600 bg-slate-50 border-slate-200' },
  Gold:     { label: 'Gold',     color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  Platinum: { label: 'Platinum', color: 'text-purple-700 bg-purple-50 border-purple-200' },
};

function getTier(pts: number) {
  if (pts >= 2000) return 'Platinum';
  if (pts >= 500)  return 'Gold';
  if (pts >= 100)  return 'Silver';
  return 'Bronze';
}

function TierBadge({ pts }: { pts: number }) {
  const tier = getTier(pts);
  const cfg  = TIER_LABEL[tier];
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function txTypeLabel(type: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    EARN_ORDER:    { label: 'Earned',   color: 'text-green-700 bg-green-50' },
    REDEEM:        { label: 'Redeemed', color: 'text-red-600 bg-red-50' },
    BONUS:         { label: 'Bonus',    color: 'text-blue-700 bg-blue-50' },
    ADMIN_ADJUST:  { label: 'Adjusted', color: 'text-purple-700 bg-purple-50' },
    REFUND:        { label: 'Refund',   color: 'text-teal-700 bg-teal-50' },
  };
  return map[type] ?? { label: type, color: 'text-gray-600 bg-gray-50' };
}

// ─── Adjust-points modal ──────────────────────────────────────────────────────
function AdjustModal({
  user,
  onClose,
  onDone,
}: {
  user: UserRow;
  onClose: () => void;
  onDone: (newBalance: number) => void;
}) {
  const [action, setAction]   = useState<'add' | 'subtract' | 'set'>('add');
  const [points, setPoints]   = useState('');
  const [reason, setReason]   = useState('');
  const [error, setError]     = useState('');
  const [pending, startTx]    = useTransition();

  const preview = (() => {
    const p = Number(points);
    if (isNaN(p) || p <= 0) return null;
    if (action === 'add')      return user.loyaltyPoints + p;
    if (action === 'subtract') return Math.max(0, user.loyaltyPoints - p);
    return p;
  })();

  const submit = () => {
    setError('');
    const p = Number(points);
    if (!points.trim() || isNaN(p) || p <= 0) {
      setError('Enter a valid positive number');
      return;
    }
    startTx(async () => {
      const res = await fetch('/api/admin/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action, points: p, reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong'); return; }
      onDone(data.newBalance);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg">
            Adjust Points — {user.name || 'User'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <FiX />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Current balance: <strong className="text-gray-900">{user.loyaltyPoints} pts</strong>
          <TierBadge pts={user.loyaltyPoints} />
        </p>

        {/* Action selector */}
        <div className="flex gap-2 mb-4">
          {(['add', 'subtract', 'set'] as const).map(a => (
            <button
              key={a}
              onClick={() => setAction(a)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors capitalize ${
                action === a
                  ? a === 'subtract'
                    ? 'bg-red-500 text-white border-red-500'
                    : a === 'set'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {a === 'add' && <FiPlus className="inline mr-1" />}
              {a === 'subtract' && <FiMinus className="inline mr-1" />}
              {a === 'set' && <FiEdit2 className="inline mr-1" />}
              {a === 'add' ? 'Add' : a === 'subtract' ? 'Remove' : 'Set to'}
            </button>
          ))}
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {action === 'set' ? 'New balance' : 'Points'}
            </label>
            <input
              type="number"
              min={1}
              value={points}
              onChange={e => setPoints(e.target.value)}
              placeholder="e.g. 100"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Reason <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Welcome bonus, correction…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        </div>

        {preview !== null && (
          <div className="flex items-center gap-2 text-sm bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-4 text-blue-700">
            <FiCheck className="shrink-0" />
            New balance will be <strong className="ml-1">{preview} pts</strong>
            <span className="ml-1">({getTier(preview)} tier)</span>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm mb-3">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {pending ? <FiLoader className="animate-spin" /> : <FiCheck />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LoyaltyManager({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers]         = useState<UserRow[]>(initialUsers);
  const [expandedId, setExpanded] = useState<string | null>(null);
  const [fullTxUser, setFullTxUser] = useState<string | null>(null);
  const [fullTxData, setFullTxData] = useState<Record<string, Transaction[]>>({});
  const [adjustUser, setAdjustUser] = useState<UserRow | null>(null);
  const [deletingTx, setDeletingTx] = useState<string | null>(null);
  const [txLoading, setTxLoading]   = useState<string | null>(null);
  const [search, setSearch]         = useState('');

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone || '').includes(q)
    );
  });

  const totalPoints  = users.reduce((s, u) => s + u.loyaltyPoints, 0);
  const usersWithPts = users.filter(u => u.loyaltyPoints > 0).length;

  const handleAdjustDone = (userId: string, newBalance: number) => {
    setUsers(prev => prev.map(u =>
      u.id === userId
        ? { ...u, loyaltyPoints: newBalance, _count: { loyaltyTransactions: u._count.loyaltyTransactions + 1 } }
        : u
    ));
    setAdjustUser(null);
    // Clear cached transactions so next expand fetches fresh data
    setFullTxData(prev => { const n = { ...prev }; delete n[userId]; return n; });
  };

  const loadFullTransactions = async (userId: string) => {
    if (fullTxData[userId]) return;
    setTxLoading(userId);
    try {
      const res = await fetch(`/api/admin/loyalty/transaction?userId=${userId}`);
      const data = await res.json();
      if (data.success) setFullTxData(prev => ({ ...prev, [userId]: data.transactions }));
    } finally {
      setTxLoading(null);
    }
  };

  const handleExpand = async (userId: string) => {
    if (expandedId === userId) { setExpanded(null); return; }
    setExpanded(userId);
    setFullTxUser(null);
  };

  const handleViewAll = async (userId: string) => {
    setFullTxUser(userId);
    await loadFullTransactions(userId);
  };

  const handleDeleteTx = async (txId: string, userId: string) => {
    if (!confirm('Delete this transaction and reverse its points?')) return;
    setDeletingTx(txId);
    try {
      const res = await fetch('/api/admin/loyalty/transaction', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txId }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed to delete'); return; }

      // Remove transaction and recalculate balance from the deleted tx
      const tx = (fullTxData[userId] || []).find(t => t.id === txId);
      const pointsToReverse = tx?.points ?? 0;
      setFullTxData(prev => ({
        ...prev,
        [userId]: (prev[userId] || []).filter(t => t.id !== txId),
      }));
      setUsers(prev => prev.map(u =>
        u.id === userId
          ? {
              ...u,
              loyaltyPoints: Math.max(0, u.loyaltyPoints - pointsToReverse),
              loyaltyTransactions: u.loyaltyTransactions.filter(t => t.id !== txId),
              _count: { loyaltyTransactions: u._count.loyaltyTransactions - 1 },
            }
          : u
      ));
    } finally {
      setDeletingTx(null);
    }
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Have Points</p>
          <p className="text-2xl font-bold text-amber-600">{usersWithPts}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Points Issued</p>
          <p className="text-2xl font-bold text-primary-700">{totalPoints.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Est. Liability</p>
          <p className="text-2xl font-bold text-red-600">₹{Math.floor(totalPoints / 10).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FiAward className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Transactions</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(user => {
                  const expanded = expandedId === user.id;
                  const txList = fullTxUser === user.id && fullTxData[user.id]
                    ? fullTxData[user.id]
                    : user.loyaltyTransactions;
                  const isLoadingTx = txLoading === user.id;

                  return (
                    <>
                      <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${expanded ? 'bg-amber-50/40' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                              {(user.name || user.email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.name || 'Unnamed'}</p>
                              <p className="text-xs text-gray-400">{user.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          <p className="text-xs">
                            {user.email.endsWith('@darshan.local') ? (
                              <span className="text-gray-400 italic">Phone login</span>
                            ) : user.email}
                          </p>
                          {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-lg font-bold text-gray-900">{user.loyaltyPoints.toLocaleString('en-IN')}</span>
                          <p className="text-xs text-gray-400">= ₹{Math.floor(user.loyaltyPoints / 10)}</p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <TierBadge pts={user.loyaltyPoints} />
                        </td>
                        <td className="px-5 py-4 text-center text-gray-600">
                          {user._count.loyaltyTransactions}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setAdjustUser(user)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-semibold hover:bg-primary-100 transition-colors"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" /> Adjust
                            </button>
                            {user._count.loyaltyTransactions > 0 && (
                              <button
                                onClick={() => handleExpand(user.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
                              >
                                {expanded ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
                                History
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded transaction history */}
                      {expanded && (
                        <tr key={`${user.id}-tx`}>
                          <td colSpan={6} className="bg-amber-50/60 border-b border-amber-100">
                            <div className="px-5 py-4">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                                  <FiClock className="w-3.5 h-3.5" /> Transaction History
                                </p>
                                {user._count.loyaltyTransactions > 5 && fullTxUser !== user.id && (
                                  <button
                                    onClick={() => handleViewAll(user.id)}
                                    className="text-xs text-primary-600 hover:underline"
                                  >
                                    {isLoadingTx ? 'Loading…' : `View all ${user._count.loyaltyTransactions}`}
                                  </button>
                                )}
                              </div>

                              <div className="space-y-2">
                                {(isLoadingTx ? [] : txList).map(tx => {
                                  const cfg = txTypeLabel(tx.type);
                                  return (
                                    <div key={tx.id} className="flex items-center gap-3 bg-white rounded-lg border border-amber-100 px-3 py-2.5">
                                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color} shrink-0`}>
                                        {cfg.label}
                                      </span>
                                      <span className={`font-bold text-sm shrink-0 ${tx.points >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {tx.points >= 0 ? '+' : ''}{tx.points}
                                      </span>
                                      <span className="flex-1 text-xs text-gray-600 truncate">{tx.description}</span>
                                      <span className="text-xs text-gray-400 shrink-0">
                                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                                      </span>
                                      <button
                                        onClick={() => handleDeleteTx(tx.id, user.id)}
                                        disabled={deletingTx === tx.id}
                                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0 disabled:opacity-40"
                                        title="Delete transaction (reverses points)"
                                      >
                                        {deletingTx === tx.id ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiTrash2 className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  );
                                })}
                                {isLoadingTx && (
                                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                                    <FiLoader className="animate-spin w-4 h-4" /> Loading transactions…
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust modal */}
      {adjustUser && (
        <AdjustModal
          user={adjustUser}
          onClose={() => setAdjustUser(null)}
          onDone={(newBalance) => handleAdjustDone(adjustUser.id, newBalance)}
        />
      )}
    </>
  );
}
