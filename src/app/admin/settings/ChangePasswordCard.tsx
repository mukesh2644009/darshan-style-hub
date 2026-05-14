'use client';

import { useState } from 'react';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiAlertTriangle, FiLoader, FiShield } from 'react-icons/fi';

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${
            error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function StrengthBar({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-600'];
  const textColors = ['text-red-600', 'text-orange-600', 'text-yellow-600', 'text-green-600', 'text-green-700'];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= score ? colors[score - 1] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score - 1] || 'text-gray-400'}`}>
        {labels[score - 1] || ''}
        {score < 3 && password.length > 0 && (
          <span className="text-gray-400 font-normal ml-1">
            — use uppercase, numbers & symbols
          </span>
        )}
      </p>
    </div>
  );
}

export default function ChangePasswordCard() {
  const [current, setCurrent]   = useState('');
  const [next, setNext]         = useState('');
  const [confirm, setConfirm]   = useState('');
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!current.trim()) e.current = 'Enter your current password';
    if (!next.trim())    e.next    = 'Enter a new password';
    else if (next.length < 8) e.next = 'Must be at least 8 characters';
    if (next !== confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ api: data.error || 'Failed to update password' });
        return;
      }
      setSuccess(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch {
      setErrors({ api: 'Network error — please try again' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        <FiShield className="w-5 h-5 text-primary-600" />
        Change Admin Password
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        Use a strong, unique password — at least 8 characters with a mix of uppercase, numbers, and symbols.
      </p>

      {/* Warning banner if any session uses the default seed credentials */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800">
        <FiAlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
        <span>
          If you haven&apos;t changed your password since setup, do it now. The default seed password <strong>admin123</strong> is public knowledge and your site is live.
        </span>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 text-sm text-green-700">
          <FiCheck className="w-4 h-4 shrink-0" />
          Password updated successfully. All other sessions have been signed out.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <PasswordInput
          label="Current password"
          value={current}
          onChange={setCurrent}
          placeholder="Your current password"
          error={errors.current}
        />
        <div>
          <PasswordInput
            label="New password"
            value={next}
            onChange={setNext}
            placeholder="At least 8 characters"
            error={errors.next}
          />
          <StrengthBar password={next} />
        </div>
        <PasswordInput
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Repeat new password"
          error={errors.confirm}
        />

        {errors.api && (
          <p className="text-red-600 text-sm flex items-center gap-1.5">
            <FiAlertTriangle className="w-4 h-4 shrink-0" /> {errors.api}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors disabled:opacity-60"
        >
          {loading ? <FiLoader className="animate-spin w-4 h-4" /> : <FiLock className="w-4 h-4" />}
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
