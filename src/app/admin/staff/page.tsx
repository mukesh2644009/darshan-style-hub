'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiTrash2, FiLoader, FiCheck, FiUser, FiMail, FiPhone, FiLock, FiX } from 'react-icons/fi';

interface StaffMember { id: string; name: string; email: string; phone?: string; createdAt: string; }

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchStaff(); }, []);

  async function fetchStaff() {
    setLoading(true);
    const res = await fetch('/api/admin/staff');
    const data = await res.json();
    if (data.success) setStaff(data.staff);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStaff(prev => [data.staff, ...prev]);
        setForm({ name: '', email: '', phone: '', password: '' });
        setShowAdd(false);
        setSuccess('Staff member added!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to add');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(id);
    try {
      await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
      setStaff(prev => prev.filter(s => s.id !== id));
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiUser className="w-6 h-6 text-rose-600" /> Staff Accounts
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage POS terminal access for your team</p>
        </div>
        <div className="flex items-center gap-3">
          {success && <span className="text-sm text-green-600 flex items-center gap-1"><FiCheck className="w-4 h-4" /> {success}</span>}
          <a href="/pos" target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
            Open POS ↗
          </a>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 transition-colors">
            <FiPlus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* POS info card */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6">
        <p className="text-sm text-rose-800 font-semibold">📱 POS Terminal URL</p>
        <p className="text-sm text-rose-700 mt-1">Share this link with your staff: <strong>darshanstylehub.com/pos</strong></p>
        <p className="text-xs text-rose-600 mt-1">Staff log in with their email & password set below. They can only access the POS — not the admin panel.</p>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-rose-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">New Staff Member</h2>
            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><FiX /></button>
          </div>
          <form onSubmit={handleAdd} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                  placeholder="Ravi Kumar" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
                  placeholder="ravi@darshanstylehub.com" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required
                  minLength={6} placeholder="Min 6 characters" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-400" />
              </div>
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-60">
                {saving ? <FiLoader className="animate-spin w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
                {saving ? 'Adding…' : 'Add Staff Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff list */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><FiLoader className="animate-spin w-8 h-8 text-rose-600" /></div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
          <FiUser className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No staff accounts yet</p>
          <p className="text-sm mt-1">Add staff members so they can use the POS terminal</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Added</th>
                <th className="px-5 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-sm shrink-0">
                        {s.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{s.email}</td>
                  <td className="px-5 py-4 text-gray-600">{s.phone || '—'}</td>
                  <td className="px-5 py-4 text-gray-400 text-xs">
                    {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleDelete(s.id)} disabled={deleteId === s.id}
                      className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40">
                      {deleteId === s.id ? <FiLoader className="animate-spin w-4 h-4" /> : <FiTrash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
