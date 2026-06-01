'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiMail, FiLock, FiLoader } from 'react-icons/fi';

export default function PosLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Login failed');
        return;
      }
      if (data.user.role !== 'STAFF' && data.user.role !== 'ADMIN') {
        setError('You do not have staff access.');
        return;
      }
      router.push('/pos');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/products/logo.jpeg" alt="Darshan Style Hub" width={72} height={72}
            className="mx-auto rounded-2xl shadow-md object-contain mix-blend-multiply mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Staff Login</h1>
          <p className="text-sm text-gray-500 mt-1 italic">Art in Every Thread</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                placeholder="staff@example.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                placeholder="••••••••" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
            {loading ? <><FiLoader className="animate-spin w-4 h-4" /> Logging in…</> : 'Login to POS'}
          </button>
        </form>
      </div>
    </div>
  );
}
