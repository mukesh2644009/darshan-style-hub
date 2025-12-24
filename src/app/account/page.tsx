'use client';

import { useState } from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiPackage, FiHeart, FiLogOut, FiEdit2 } from 'react-icons/fi';
import Link from 'next/link';

export default function AccountPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Login Form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-accent-50 py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser size={32} className="text-primary-600" />
              </div>
              <h1 className="font-display text-2xl font-bold text-gray-900">Welcome Back</h1>
              <p className="text-gray-500 mt-2">Sign in to your account</p>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="input-field" placeholder="Enter your email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" className="input-field" placeholder="Enter your password" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-primary-600" />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-primary-600 hover:text-primary-700">Forgot password?</a>
              </div>
              <button
                type="button"
                onClick={() => setIsLoggedIn(true)}
                className="w-full btn-primary"
              >
                Sign In
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Account Dashboard
  return (
    <div className="min-h-screen bg-accent-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">My Account</h1>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-primary-600">JD</span>
                </div>
                <h2 className="font-medium text-gray-900">John Doe</h2>
                <p className="text-sm text-gray-500">john@example.com</p>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    activeTab === 'profile' ? 'bg-primary-100 text-primary-700' : 'hover:bg-accent-100'
                  }`}
                >
                  <FiUser size={20} />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    activeTab === 'orders' ? 'bg-primary-100 text-primary-700' : 'hover:bg-accent-100'
                  }`}
                >
                  <FiPackage size={20} />
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    activeTab === 'wishlist' ? 'bg-primary-100 text-primary-700' : 'hover:bg-accent-100'
                  }`}
                >
                  <FiHeart size={20} />
                  Wishlist
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    activeTab === 'addresses' ? 'bg-primary-100 text-primary-700' : 'hover:bg-accent-100'
                  }`}
                >
                  <FiMapPin size={20} />
                  Addresses
                </button>
                <hr className="border-accent-200" />
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FiLogOut size={20} />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold text-gray-900">Profile Information</h2>
                  <button className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <FiEdit2 size={16} />
                    Edit
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-500">Full Name</label>
                    <p className="font-medium text-gray-900">John Doe</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium text-gray-900">john@example.com</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="font-medium text-gray-900">+91 98765 43210</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Gender</label>
                    <p className="font-medium text-gray-900">Male</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-display text-xl font-bold text-gray-900 mb-6">My Orders</h2>
                
                <div className="text-center py-12">
                  <FiPackage size={64} className="mx-auto text-accent-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
                  <Link href="/products" className="btn-primary inline-block">
                    Shop Now
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-display text-xl font-bold text-gray-900 mb-6">My Wishlist</h2>
                
                <div className="text-center py-12">
                  <FiHeart size={64} className="mx-auto text-accent-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
                  <p className="text-gray-500 mb-6">Save items you love to your wishlist</p>
                  <Link href="/products" className="btn-primary inline-block">
                    Browse Products
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold text-gray-900">Saved Addresses</h2>
                  <button className="btn-outline text-sm py-2">
                    Add New Address
                  </button>
                </div>

                <div className="border border-accent-200 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">Home</span>
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        John Doe<br />
                        123 Main Street, MG Road<br />
                        Bangalore, Karnataka 560001<br />
                        +91 98765 43210
                      </p>
                    </div>
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

