'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FiHome, FiShoppingBag, FiPackage, FiUsers, FiSettings,
  FiArrowLeft, FiMessageSquare, FiLoader, FiLogOut, FiRotateCcw,
  FiChevronRight, FiMenu, FiX,
} from 'react-icons/fi';

const navItems = [
  { name: 'Dashboard', href: '/admin',          icon: FiHome,         exact: true  },
  { name: 'Orders',    href: '/admin/orders',    icon: FiShoppingBag               },
  { name: 'Returns',   href: '/admin/returns',   icon: FiRotateCcw                 },
  { name: 'Products',  href: '/admin/products',  icon: FiPackage                   },
  { name: 'Customers', href: '/admin/customers', icon: FiUsers                     },
  { name: 'Messages',  href: '/admin/messages',  icon: FiMessageSquare             },
  { name: 'Settings',  href: '/admin/settings',  icon: FiSettings                  },
];

interface User { id: string; email: string; name: string | null; role: string }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  // Lock the body scroll while the drawer is open so the page behind doesn't scroll.
  useEffect(() => {
    if (mobileNavOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileNavOpen]);

  const checkAuth = async () => {
    try {
      const res  = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.user?.role === 'ADMIN') {
        setUser(data.user);
      } else {
        router.push(res.ok ? '/login?redirect=/admin&error=admin_required' : '/login?redirect=/admin');
      }
    } catch {
      router.push('/login?redirect=/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Redirecting…</p>
      </div>
    );
  }

  const initials = (user.name || user.email).slice(0, 2).toUpperCase();

  const sidebarBody = (
    <>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shrink-0">
            <FiShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight truncate">Darshan Style Hub</p>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close menu"
          className="lg:hidden p-2 -mr-1 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ name, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span className="flex-1">{name}</span>
              {active && <FiChevronRight className="w-3.5 h-3.5 text-primary-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <FiLogOut className="w-4 h-4" />
          Logout
        </button>
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{user.name || 'Admin'}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Desktop sidebar (lg and up) */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-gray-100 flex-col min-h-screen sticky top-0">
        {sidebarBody}
      </aside>

      {/* Mobile off-canvas drawer + backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-200 ${
          mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileNavOpen}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileNavOpen(false)}
        />
        <aside
          className={`absolute top-0 left-0 h-full w-72 max-w-[85%] bg-white shadow-xl flex flex-col transform transition-transform duration-200 ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarBody}
        </aside>
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3 lg:py-4 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 shrink-0"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0 overflow-hidden">
              {pathname.split('/').filter(Boolean).map((seg, i, arr) => (
                <span key={i} className="flex items-center gap-2 min-w-0">
                  {i > 0 && <span className="text-gray-300">/</span>}
                  <span className={`capitalize truncate ${i === arr.length - 1 ? 'text-gray-900 font-semibold' : ''}`}>
                    {seg}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <a
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-600 transition-colors shrink-0"
          >
            View Store ↗
          </a>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
