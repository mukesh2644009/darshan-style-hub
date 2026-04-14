'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiLoader, FiRefreshCw, FiExternalLink, FiCheck, FiX, FiDollarSign } from 'react-icons/fi';
import { RETURN_REASONS } from '@/lib/return-reasons';

type ReturnRow = {
  id: string;
  reason: string;
  details: string | null;
  adminNotes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  order: {
    id: string;
    status: string;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    razorpayPaymentId: string | null;
    razorpayRefundId: string | null;
    shippingName: string;
    shippingPhone: string;
    createdAt: string;
  };
};

interface Props {
  initialReturns: ReturnRow[];
}

function reasonLabel(code: string) {
  return RETURN_REASONS.find((r) => r.value === code)?.label ?? code;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-900',
    APPROVED: 'bg-blue-100 text-blue-800',
    REJECTED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-green-100 text-green-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800';
}

export default function AdminReturnsDashboard({ initialReturns }: Props) {
  const [rows, setRows] = useState<ReturnRow[]>(initialReturns);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const refresh = async () => {
    const res = await fetch('/api/admin/returns');
    const data = await res.json();
    if (data.success) {
      setRows(data.returns);
    }
  };

  const patchStatus = async (id: string, status: string, adminNotes?: string) => {
    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/returns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Update failed');
        return;
      }
      await refresh();
    } catch {
      setError('Request failed');
    } finally {
      setLoadingId(null);
      setRejectId(null);
      setRejectNotes('');
    }
  };

  const postRefund = async (id: string, mode: 'razorpay' | 'manual') => {
    if (mode === 'razorpay' && !confirm('Issue a full refund via Razorpay for this order total?')) return;
    if (mode === 'manual' && !confirm('Mark this order as refunded manually (e.g. COD / bank transfer)?')) return;

    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/returns/${id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Refund failed');
        return;
      }
      await refresh();
    } catch {
      setError('Refund request failed');
    } finally {
      setLoadingId(null);
    }
  };

  const confirmReject = () => {
    if (!rejectId) return;
    patchStatus(rejectId, 'REJECTED', rejectNotes || undefined);
  };

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Returns</h1>
          <p className="text-gray-600 mt-1">Review return requests, update status, and process refunds</p>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No return requests yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => {
                  const busy = loadingId === row.id;
                  const canApproveReject = row.status === 'PENDING';
                  const canRefund = row.status === 'APPROVED';
                  const online =
                    row.order.paymentStatus === 'PAID' && !!row.order.razorpayPaymentId;

                  return (
                    <tr key={row.id} className="align-top hover:bg-gray-50/80">
                      <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <p className="font-medium text-gray-900">{row.user.name || '—'}</p>
                        <p className="text-gray-500">{row.user.email}</p>
                        {row.user.phone && <p className="text-gray-500">{row.user.phone}</p>}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <Link
                          href={`/admin/orders/${row.order.id}`}
                          className="font-mono text-primary-600 hover:underline inline-flex items-center gap-1"
                        >
                          #{row.order.id.slice(0, 8).toUpperCase()}
                          <FiExternalLink className="w-3 h-3" />
                        </Link>
                        <p className="text-gray-600 mt-1">
                          ₹{row.order.total.toLocaleString('en-IN')}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-800 max-w-[200px]">
                        <p>{reasonLabel(row.reason)}</p>
                        {row.details && (
                          <p className="text-gray-500 text-xs mt-1 line-clamp-3">{row.details}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusBadge(row.status)}`}>
                          {row.status}
                        </span>
                        {row.adminNotes && (
                          <p className="text-xs text-gray-500 mt-2 max-w-[180px]">
                            Note: {row.adminNotes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <p>{row.order.paymentMethod}</p>
                        <p className="text-gray-600">{row.order.paymentStatus}</p>
                        {row.order.razorpayRefundId && (
                          <p className="text-xs text-gray-400 mt-1 font-mono truncate max-w-[140px]" title={row.order.razorpayRefundId}>
                            Refund: {row.order.razorpayRefundId}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          {busy && (
                            <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                              <FiLoader className="animate-spin w-4 h-4" /> Working…
                            </span>
                          )}
                          {!busy && canApproveReject && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => patchStatus(row.id, 'APPROVED')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                              >
                                <FiCheck className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectId(row.id);
                                  setRejectNotes('');
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-sm hover:bg-red-100"
                              >
                                <FiX className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          )}
                          {!busy && canRefund && (
                            <div className="flex flex-col gap-2">
                              {online && (
                                <button
                                  type="button"
                                  onClick={() => postRefund(row.id, 'razorpay')}
                                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-800"
                                >
                                  <FiDollarSign className="w-4 h-4" />
                                  Refund via Razorpay
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => postRefund(row.id, 'manual')}
                                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-800 text-sm hover:bg-gray-50"
                              >
                                Mark refunded (manual)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Close this return as completed without changing payment? (e.g. exchange fulfilled)')) {
                                    patchStatus(row.id, 'COMPLETED');
                                  }
                                }}
                                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-800 text-sm hover:bg-green-100"
                              >
                                <FiCheck className="w-4 h-4" />
                                Complete (no refund)
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setRejectId(null)}>
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject return</h3>
            <p className="text-sm text-gray-600 mb-4">Optional note (stored internally).</p>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value.slice(0, 2000))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
              placeholder="Reason for rejection…"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setRejectId(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReject}
                className="px-4 py-2 rounded-lg bg-red-600 text-white"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
