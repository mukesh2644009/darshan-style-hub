'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiShoppingBag, FiPackage, FiUsers, FiSettings, FiArrowLeft, FiMessageSquare, FiLoader, FiLogOut } from 'react-icons/fi';

const adminNavItems = [
  { name: 'Dashboard', href: '/admin', icon: FiHome },
  { name: 'Orders', href: '/admin/orders', icon: FiShoppingBag },
  { name: 'Products', href: '/admin/products', icon: FiPackage },
  { name: 'Customers', href: '/admin/customers', icon: FiUsers },
  { name: 'Messages', href: '/admin/messages', icon: FiMessageSquare },
  { name: 'Settings', href: '/admin/settings', icon: FiSettings },
];

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.role === 'ADMIN') {
          setUser(data.user);
        } else {
          // Not admin, redirect to login
          router.push('/login?redirect=/admin&error=admin_required');
        }
      } else {
        // Not logged in, redirect to login
        router.push('/login?redirect=/admin');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login?redirect=/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <header className="bg-gray-900 text-white py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
            <FiArrowLeft />
            <span>Back to Store</span>
          </Link>
          <span className="text-gray-600">|</span>
          <h1 className="text-xl font-bold">Darshan Style Hub - Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Welcome, {user.name || user.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiLogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg min-h-[calc(100vh-64px)]">
          <nav className="p-4">
            <ul className="space-y-2">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-100 text-primary-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

