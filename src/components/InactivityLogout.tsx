'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

// Admin pages use a tighter timeout (30 min); store pages use 60 min
// The real security gate is the server-side 8-hour sliding session for admins.
const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
const INACTIVE_MS   = (isAdminPage ? 30 : 60) * 60 * 1000;
const WARN_BEFORE_MS = 60 * 1000;      // warn 1 minute before

export default function InactivityLogout() {
  const { isAuthenticated, logout } = useAuthStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const resetTimers = () => {
    clearTimers();
    setShowWarning(false);

    warnTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(60);
      countdownRef.current = setInterval(() => {
        setSecondsLeft((s) => Math.max(0, s - 1));
      }, 1000);
    }, INACTIVE_MS - WARN_BEFORE_MS);

    timerRef.current = setTimeout(async () => {
      clearTimers();
      setShowWarning(false);
      await logout();
      window.location.href = '/login?reason=inactivity';
    }, INACTIVE_MS);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      setShowWarning(false);
      return;
    }

    const events = ['touchstart', 'click', 'keypress', 'scroll', 'mousemove'];
    const onActivity = () => resetTimers();

    resetTimers();
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    return () => {
      clearTimers();
      events.forEach((e) => window.removeEventListener(e, onActivity));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadeIn">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Still there?</h3>
        <p className="text-sm text-gray-600 mb-4">
          You&apos;ll be logged out in <span className="font-semibold text-red-600">{secondsLeft}s</span> due to inactivity.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => resetTimers()}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            Stay Logged In
          </button>
          <button
            onClick={async () => {
              clearTimers();
              setShowWarning(false);
              await logout();
              window.location.href = '/';
            }}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
