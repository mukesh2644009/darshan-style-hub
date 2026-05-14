'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { FiShoppingBag, FiSearch, FiMenu, FiX, FiUser, FiHeart, FiLogOut, FiSettings, FiChevronDown } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import SearchOverlay from '@/components/SearchOverlay';

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const shopMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    // Force page reload to clear all state
    window.location.href = '/';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFF8E6]/95 backdrop-blur-md border-b border-accent-200">
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
          {/* Left: Menu + Logo grouped together */}
          <div className="flex items-center gap-1">
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
          </div>

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
                  className="absolute left-0 top-full z-50 mt-1 min-w-[12rem] rounded-lg border border-accent-200 bg-[#FFF8E6] py-1 shadow-lg animate-fadeIn"
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
          <div className="flex items-center space-x-1 sm:space-x-4">
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
            
            {/* User Menu — visible on ALL screen sizes */}
            <div className="relative" ref={userMenuRef}>
              {/* Mobile: show Login button when not authenticated, user icon when authenticated */}
              {mounted && !isAuthenticated ? (
                <Link
                  href="/login"
                  className="sm:hidden px-3 py-1.5 rounded-full bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
                >
                  Login
                </Link>
              ) : null}
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`p-2 hover:bg-accent-100 rounded-full transition-colors flex items-center gap-2 ${
                  mounted && !isAuthenticated ? 'hidden sm:flex' : 'flex'
                }`}
              >
                <FiUser size={20} />
                {mounted && isAuthenticated && (
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
                  {isAuthenticated ? (
                    <>
                      {/* Avatar header */}
                      <div className="px-5 py-4 bg-gradient-to-br from-primary-50 to-accent-100 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-sm">
                              {user?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
                            {user?.email && !user.email.endsWith('@darshan.local') ? (
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            ) : (
                              <p className="text-xs text-primary-600 font-medium">Guest account</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-2 px-2">
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                              <FiSettings size={15} className="text-gray-600 group-hover:text-primary-600" />
                            </div>
                            <span className="text-sm font-medium">Admin Dashboard</span>
                          </Link>
                        )}
                        <Link
                          href="/my-orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                            <FiShoppingBag size={15} className="text-gray-600 group-hover:text-primary-600" />
                          </div>
                          <span className="text-sm font-medium">My Orders</span>
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                            <FiUser size={15} className="text-gray-600 group-hover:text-primary-600" />
                          </div>
                          <span className="text-sm font-medium">My Profile</span>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="px-2 pb-2 border-t border-gray-100 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 w-full transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                            <FiLogOut size={15} className="text-red-500" />
                          </div>
                          <span className="text-sm font-medium">Logout</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 space-y-1.5">
                      <Link
                        href="/login"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Create Account
                      </Link>
                    </div>
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

        {/* Search Overlay — rendered outside nav so it covers full screen */}
        <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-[#FFF8E6] border-t border-accent-200 animate-slideDown">
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
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">{user?.name}</p>
                    {user?.email && !user.email.endsWith('@darshan.local') && (
                      <p className="text-sm text-gray-500">{user.email}</p>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
                  >
                    <FiLogOut size={14} />
                    Logout
                  </button>
                </div>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
                    Admin Dashboard
                  </Link>
                )}
                <Link href="/my-orders" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
                  My Orders
                </Link>
                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
                  My Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium text-center">
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
