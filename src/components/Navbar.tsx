'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { FiShoppingBag, FiSearch, FiMenu, FiX, FiUser, FiHeart, FiLogOut, FiSettings, FiChevronDown } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const shopMenuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const { openCart, getTotalItems } = useCartStore();
  const { user, isAuthenticated, isAdmin, logout, checkAuth } = useAuthStore();
  const { getTotalItems: getWishlistItems } = useWishlistStore();
  const totalItems = getTotalItems();
  const wishlistItems = getWishlistItems();

  // Check auth on mount and on route change
  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth, pathname]);

  useEffect(() => {
    setIsShopMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isShopMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (shopMenuRef.current && !shopMenuRef.current.contains(e.target as Node)) {
        setIsShopMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isShopMenuOpen]);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    // Force page reload to clear all state
    window.location.href = '/';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-accent-200">
      {/* Top Bar — compact on small screens so hero isn’t pushed down by wrapped text */}
      <div className="bg-primary-700 text-white text-center px-2 py-1 sm:px-3 sm:py-2">
        <p className="text-[11px] leading-snug sm:hidden">
          Free shipping ₹999+ · Designer suits &amp; co-ord sets
        </p>
        <p className="hidden text-sm sm:block">
          ✨ Free Shipping on orders above ₹999 | Shop Designer Suits &amp; Co Ord Sets
        </p>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/products/logo.jpeg"
              alt="Darshan Style Hub"
              width={60}
              height={60}
              className="h-10 w-auto object-contain mix-blend-multiply sm:h-12 md:h-14"
              priority
            />
            <span className="font-display text-xl sm:text-2xl font-bold text-red-700 hidden sm:block truncate max-w-[9rem] sm:max-w-[11rem] md:max-w-[13rem] xl:max-w-none">
              Darshan Style Hub™
            </span>
          </Link>

          {/* Desktop Navigation — Shop dropdown keeps the bar on one row */}
          <div className="hidden lg:flex items-center gap-x-3 xl:gap-x-5 2xl:gap-x-6 flex-nowrap min-w-0">
            <Link
              href="/"
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium text-sm xl:text-base whitespace-nowrap shrink-0"
            >
              Home
            </Link>
            <div className="relative shrink-0" ref={shopMenuRef}>
              <button
                type="button"
                aria-expanded={isShopMenuOpen}
                aria-haspopup="true"
                onClick={() => setIsShopMenuOpen((o) => !o)}
                className="inline-flex items-center gap-1 text-gray-700 hover:text-primary-600 transition-colors font-medium text-sm xl:text-base whitespace-nowrap"
              >
                Shop
                <FiChevronDown className={`shrink-0 transition-transform ${isShopMenuOpen ? 'rotate-180' : ''}`} size={16} aria-hidden />
              </button>
              {isShopMenuOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-1 min-w-[12rem] rounded-lg border border-accent-200 bg-white py-1 shadow-lg animate-fadeIn"
                  role="menu"
                >
                  <Link
                    href="/products"
                    role="menuitem"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-accent-50 hover:text-primary-600 whitespace-nowrap"
                    onClick={() => setIsShopMenuOpen(false)}
                  >
                    All Products
                  </Link>
                  <Link
                    href="/products?category=Suits"
                    role="menuitem"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-accent-50 hover:text-primary-600 whitespace-nowrap"
                    onClick={() => setIsShopMenuOpen(false)}
                  >
                    Suits
                  </Link>
                  <Link
                    href="/products?category=Co Ord Sets"
                    role="menuitem"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-accent-50 hover:text-primary-600 whitespace-nowrap"
                    onClick={() => setIsShopMenuOpen(false)}
                  >
                    Co Ord Sets
                  </Link>
                  <Link
                    href="/products?newArrival=true"
                    role="menuitem"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-accent-50 hover:text-primary-600 whitespace-nowrap"
                    onClick={() => setIsShopMenuOpen(false)}
                  >
                    New Arrivals
                  </Link>
                </div>
              )}
            </div>
            <Link
              href="/blog"
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium text-sm xl:text-base whitespace-nowrap shrink-0"
            >
              Blog
            </Link>
            <Link
              href="/lookbook"
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium text-sm xl:text-base whitespace-nowrap shrink-0"
            >
              Lookbook
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium text-sm xl:text-base whitespace-nowrap shrink-0"
            >
              Contact
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
            <Link href="/wishlist" className="p-2 hover:bg-accent-100 rounded-full transition-colors hidden sm:block relative">
              <FiHeart size={20} />
              {mounted && wishlistItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {wishlistItems}
                </span>
              )}
            </Link>
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-2 hover:bg-accent-100 rounded-full transition-colors hidden sm:flex items-center gap-2"
              >
                <FiUser size={20} />
                {mounted && isAuthenticated && (
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
              {mounted && totalItems > 0 && (
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
                placeholder="Search suits, co ord sets, kurtis..."
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
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
              Home
            </Link>
            <Link href="/products" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
              All Products
            </Link>
            <Link href="/products?category=Suits" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
              Suits
            </Link>
            <Link href="/products?category=Co Ord Sets" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
              Co Ord Sets
            </Link>
            <Link href="/products?newArrival=true" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
              New Arrivals
            </Link>
            <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
              Blog
            </Link>
            <Link href="/lookbook" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
              Lookbook
            </Link>
            <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
              Contact
            </Link>
            <hr className="border-accent-200" />
            {isAuthenticated ? (
              <>
                <div className="py-2">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
                    Admin Dashboard
                  </Link>
                )}
                <Link href="/my-orders" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
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
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
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
