'use client';

import { useState, useEffect } from 'react';
import { FiClock } from 'react-icons/fi';

interface SaleCountdownProps {
  variant?: 'card' | 'detail';
}

function getSecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function SaleCountdown({ variant = 'card' }: SaleCountdownProps) {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    setSeconds(getSecondsUntilMidnight());
    const id = setInterval(() => {
      setSeconds(getSecondsUntilMidnight());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (seconds === null) return null;

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (variant === 'detail') {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
        <FiClock size={15} className="shrink-0" />
        <span>Sale ends in&nbsp;</span>
        <span className="font-mono font-bold tracking-wider">
          {pad(h)}:{pad(m)}:{pad(s)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
      <FiClock size={10} />
      <span className="font-mono">{pad(h)}:{pad(m)}:{pad(s)}</span>
    </div>
  );
}
