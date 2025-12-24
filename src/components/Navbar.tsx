'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { FiShoppingBag, FiSearch, FiMenu, FiX, FiUser, FiHeart, FiLogOut, FiSettings } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { openCart, getTotalItems } = useCartStore();
  const { user, isAuthenticated, isAdmin, logout, checkAuth } = useAuthStore();
  const totalItems = getTotalItems();

  // Check auth on mount and on route change
  useEffect(() => {
    checkAuth();
  }, [checkAuth, pathname]);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    // Force page reload to clear all state
    window.location.href = '/';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-accent-200">
      {/* Top Bar */}
      <div className="bg-primary-700 text-white text-center py-2 text-sm">
        <p>✨ Free Shipping on orders above ₹999 | Use code <span className="font-semibold">DARSHAN10</span> for 10% off</p>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-display text-2xl sm:text-3xl font-bold text-primary-700">
              Darshan Style Hub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              Home
            </Link>
            <Link href="/products" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              All Products
            </Link>
            <Link href="/products?category=Sarees" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              Sarees
            </Link>
            <Link href="/products?category=Suits" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              Suits
            </Link>
            <Link href="/products?category=Kurtis" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              Kurtis
            </Link>
            <Link href="/products?newArrival=true" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              New Arrivals
            </Link>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 hover:bg-accent-100 rounded-full transition-colors"
            >
              <FiSearch size={20} />
            </button>
            <Link href="/wishlist" className="p-2 hover:bg-accent-100 rounded-full transition-colors hidden sm:block">
              <FiHeart size={20} />
            </Link>
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-2 hover:bg-accent-100 rounded-full transition-colors hidden sm:flex items-center gap-2"
              >
                <FiUser size={20} />
                {isAuthenticated && (
                  <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 animate-fadeIn">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-medium text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          <FiSettings size={16} />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        href="/my-orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <FiShoppingBag size={16} />
                        My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <FiLogOut size={16} />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={openCart}
              className="p-2 hover:bg-accent-100 rounded-full transition-colors relative"
            >
              <FiShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="py-4 border-t border-accent-200 animate-fadeIn">
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Search for sarees, suits, anarkalis..."
                className="w-full pl-12 pr-4 py-3 rounded-full border border-accent-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-accent-200 animate-slideDown">
          <div className="px-4 py-4 space-y-3">
            <Link href="/" className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
              Home
            </Link>
            <Link href="/products" className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
              All Products
            </Link>
            <Link href="/products?category=Sarees" className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
              Sarees
            </Link>
            <Link href="/products?category=Suits" className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
              Suits
            </Link>
            <Link href="/products?category=Kurtis" className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
              Kurtis
            </Link>
            <Link href="/products?newArrival=true" className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
              New Arrivals
            </Link>
            <hr className="border-accent-200" />
            {isAuthenticated ? (
              <>
                <div className="py-2">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                {isAdmin && (
                  <Link href="/admin" className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
                    Admin Dashboard
                  </Link>
                )}
                <Link href="/my-orders" className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
                  My Orders
                </Link>
                <button
                  onClick={handleLogout}
                  className="block py-2 text-red-600 hover:text-red-700 font-medium w-full text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
                  Sign In
                </Link>
                <Link href="/register" className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
