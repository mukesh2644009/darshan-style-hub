'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiLoader, FiAlertCircle, FiShield, FiPhone, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import GoogleSignInButton from '@/components/GoogleSignInButton';

type Tab = 'email' | 'phone';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isAdmin, checkAuth } = useAuthStore();

  const [tab, setTab] = useState<Tab>('phone');

  // Email login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone login
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [needsName, setNeedsName] = useState(false);

  // Email OTP step for phone login
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [info, setInfo] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectUrl = searchParams.get('redirect');
  const errorType = searchParams.get('error');
  const googleErrorMessage = errorType === 'google' ? (searchParams.get('message') || 'Google sign-in failed.') : null;

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (redirectUrl) {
      if (redirectUrl.startsWith('/admin') && isAdmin) router.push(redirectUrl);
      else if (!redirectUrl.startsWith('/admin')) router.push(redirectUrl);
      else if (isAdmin) router.push('/admin');
      else router.push('/');
    } else if (isAdmin) {
      router.push('/admin');
    } else {
      router.push('/');
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

  const doGuestLogin = async () => {
    const res = await fetch('/api/auth/guest-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name: name.trim() || undefined }),
    });
    return res.json();
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      // Step 3 — verify the email OTP
      if (otpStep) {
        const res = await fetch('/api/auth/login-otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, otp: otp.trim() }),
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.error || 'Invalid code. Please try again.');
          setLoading(false);
          return;
        }
        await checkAuth();
        setLoading(false);
        return;
      }

      // Step 2 — brand new account (no email yet): create with name, no OTP
      if (needsName) {
        const data = await doGuestLogin();
        if (!data.success) {
          setError(data.error === 'new_user' ? 'Please enter your name.' : data.error || 'Login failed');
          setLoading(false);
          return;
        }
        await checkAuth();
        setLoading(false);
        return;
      }

      // Step 1 — request an OTP to the account's registered email
      const reqRes = await fetch('/api/auth/login-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const req = await reqRes.json();

      if (req.success) {
        setMaskedEmail(req.maskedEmail || '');
        setOtpStep(true);
        setInfo(
          `We've sent a 6-digit code to ${req.maskedEmail || 'your email'}. Enter it below to sign in.` +
            (req.devOtp ? ` (dev code: ${req.devOtp})` : '')
        );
        setLoading(false);
        return;
      }

      if (req.error === 'no_account') {
        setNeedsName(true);
        setError('Phone not found. Enter your name to create an account.');
        setLoading(false);
        return;
      }

      if (req.error === 'no_email') {
        // No email on file — can't send an OTP, fall back to direct phone login
        const g = await doGuestLogin();
        if (!g.success) {
          if (g.error === 'new_user') {
            setNeedsName(true);
            setError('Enter your name to create an account.');
          } else {
            setError(g.error || 'Login failed');
          }
          setLoading(false);
          return;
        }
        await checkAuth();
        setLoading(false);
        return;
      }

      setError(req.error || 'Something went wrong. Please try again.');
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const resetPhoneFlow = () => {
    setOtpStep(false);
    setOtp('');
    setMaskedEmail('');
    setNeedsName(false);
    setError('');
    setInfo('');
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

        {googleErrorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 text-sm">
            <FiAlertCircle className="flex-shrink-0" />
            <span>{googleErrorMessage}</span>
          </div>
        )}

        {/* Google sign-in */}
        <div className="mb-5">
          <GoogleSignInButton />
        </div>

        <div className="relative my-5 flex items-center">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-xs text-gray-400 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-gray-200 p-1 mb-6 gap-1">
          <button
            type="button"
            onClick={() => { setTab('phone'); resetPhoneFlow(); }}
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
            onClick={() => { setTab('email'); setError(''); setInfo(''); }}
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

        {info && !error && (
          <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700 text-sm">
            <FiMail className="flex-shrink-0" />
            <span>{info}</span>
          </div>
        )}

        {/* Phone login */}
        {tab === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-5">
            {!otpStep ? (
              <>
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
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter Verification Code</label>
                <div className="relative">
                  <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                    required
                    autoFocus
                    placeholder="6-digit code"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg tracking-[0.4em] text-center text-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <button type="button" onClick={resetPhoneFlow} className="text-xs text-gray-500 hover:text-gray-700">
                    ← Change number
                  </button>
                  {maskedEmail && <span className="text-xs text-gray-400">Sent to {maskedEmail}</span>}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><FiLoader className="animate-spin" /> Please wait…</>
              ) : otpStep ? (
                'Verify & Sign In'
              ) : needsName ? (
                'Create Account'
              ) : (
                'Continue with Phone'
              )}
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
