'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiShoppingBag, FiPackage, FiUsers, FiSettings, FiArrowLeft, FiMessageSquare } from 'react-icons/fi';

const adminNavItems = [
  { name: 'Dashboard', href: '/admin', icon: FiHome },
  { name: 'Orders', href: '/admin/orders', icon: FiShoppingBag },
  { name: 'Products', href: '/admin/products', icon: FiPackage },
  { name: 'Customers', href: '/admin/customers', icon: FiUsers },
  { name: 'Messages', href: '/admin/messages', icon: FiMessageSquare },
  { name: 'Settings', href: '/admin/settings', icon: FiSettings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
          <span className="text-sm text-gray-400">Welcome, Admin</span>
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

