'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiUser, FiLoader, FiCheck, FiEdit2, FiMapPin } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import LoyaltyWidget from '@/components/LoyaltyWidget';

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
}

interface AddressForm {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
];

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth, user, setUser } = useAuthStore();

  const [profile, setProfile] = useState<ProfileForm>({ name: '', email: '', phone: '' });
  const [address, setAddress] = useState<AddressForm>({ addressLine1: '', addressLine2: '', city: '', state: 'Rajasthan', pincode: '' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProfile({
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
          });
          if (data.address) {
            setAddress({
              addressLine1: data.address.addressLine1 || '',
              addressLine2: data.address.addressLine2 || '',
              city: data.address.city || '',
              state: data.address.state || 'Rajasthan',
              pincode: data.address.pincode || '',
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, ...address }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to update profile');
        return;
      }
      setSuccess(true);
      if (setUser && data.user) {
        setUser({ ...user!, name: data.user.name, email: data.user.email, phone: data.user.phone });
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-accent-50 flex items-center justify-center">
        <FiLoader className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50 py-12">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <FiArrowLeft />
          Back to shop
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <FiUser className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-500">Update your personal details and address</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Personal Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiUser className="w-4 h-4 text-primary-600" />
              Personal details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={e => setProfile(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(f => ({ ...f, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">Used to send order confirmations</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={e => setProfile(f => ({ ...f, phone: e.target.value }))}
                  placeholder="10-digit mobile number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiMapPin className="w-4 h-4 text-primary-600" />
              Delivery address
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address line 1</label>
                <input
                  type="text"
                  value={address.addressLine1}
                  onChange={e => setAddress(a => ({ ...a, addressLine1: e.target.value }))}
                  placeholder="House / flat no., street, area"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address line 2 <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={address.addressLine2}
                  onChange={e => setAddress(a => ({ ...a, addressLine2: e.target.value }))}
                  placeholder="Landmark, colony, etc."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
                    placeholder="City"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={address.pincode}
                    onChange={e => setAddress(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="6-digit pincode"
                    maxLength={6}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  value={address.state}
                  onChange={e => setAddress(a => ({ ...a, state: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {INDIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <FiCheck className="w-4 h-4" />
              Profile updated successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? (
              <><FiLoader className="animate-spin w-4 h-4" /> Saving…</>
            ) : (
              <><FiEdit2 className="w-4 h-4" /> Save changes</>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/my-orders" className="text-sm text-primary-600 hover:underline">
            View my orders →
          </Link>
        </div>

        {/* Loyalty Rewards */}
        <div className="mt-8">
          <LoyaltyWidget />
        </div>
      </div>
    </div>
  );
}
