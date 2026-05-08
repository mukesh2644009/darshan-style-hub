'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiLoader, FiAlertCircle, FiShield, FiPhone, FiUser } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';

type Tab = 'email' | 'phone';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isAdmin, checkAuth } = useAuthStore();

  const [tab, setTab] = useState<Tab>('phone');

  // Email login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone login
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [needsName, setNeedsName] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectUrl = searchParams.get('redirect');
  const errorType = searchParams.get('error');

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (redirectUrl) {
      if (redirectUrl.startsWith('/admin') && isAdmin) router.push(redirectUrl);
      else if (!redirectUrl.startsWith('/admin')) router.push(redirectUrl);
      else if (isAdmin) router.push('/admin');
      else router.push('/my-orders');
    } else if (isAdmin) {
      router.push('/admin');
    } else {
      router.push('/my-orders');
    }
  }, [isAuthenticated, isAdmin, router, redirectUrl]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) setError(result.error || 'Login failed');
    setLoading(false);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: name.trim() || undefined }),
      });
      const data = await res.json();

      if (data.error === 'new_user' && data.newUser) {
        // Phone not registered — ask for name
        setNeedsName(true);
        setError('Phone not found. Enter your name to create an account.');
        setLoading(false);
        return;
      }

      if (!data.success) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Reload auth state
      await checkAuth();
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {errorType === 'admin_required' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3 text-yellow-800">
            <FiShield className="flex-shrink-0" />
            <span>Admin access required. Please login with an admin account.</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex rounded-xl border border-gray-200 p-1 mb-6 gap-1">
          <button
            type="button"
            onClick={() => { setTab('phone'); setError(''); setNeedsName(false); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              tab === 'phone'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiPhone className="w-4 h-4" /> Phone
          </button>
          <button
            type="button"
            onClick={() => { setTab('email'); setError(''); setNeedsName(false); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              tab === 'email'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiMail className="w-4 h-4" /> Email
          </button>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 text-sm">
            <FiAlertCircle className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Phone login */}
        {tab === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
              <div className="relative">
                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setNeedsName(false); setError(''); }}
                  required
                  placeholder="91XXXXXXXXXX or 10-digit number"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Enter the number you used when placing your order</p>
            </div>

            {needsName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <><FiLoader className="animate-spin" /> Please wait…</> : 'Continue with Phone'}
            </button>
          </form>
        )}

        {/* Email login */}
        {tab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <><FiLoader className="animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Don&apos;t have an account?{' '}
            <Link href={redirectUrl ? `/register?redirect=${redirectUrl}` : '/register'} className="text-primary-600 hover:text-primary-700 font-medium">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
