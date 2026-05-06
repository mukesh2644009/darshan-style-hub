'use client';

import { useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiLoader, FiMapPin, FiPhone, FiUser, FiX } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';

interface QuickSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'details' | 'otp';
type ExistingProfile = {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
};

export default function QuickSignupModal({ isOpen, onClose, onSuccess }: QuickSignupModalProps) {
  const { checkAuth } = useAuthStore();

  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [profileLookupLoading, setProfileLookupLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<ExistingProfile | null>(null);

  const resetForm = () => {
    setStep('details');
    setName('');
    setPhone('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setState('');
    setPincode('');
    setOtp('');
    setError('');
    setInfoMessage('');
    setDevOtp('');
    setProfileLookupLoading(false);
    setExistingProfile(null);
    setLoading(false);
  };

  const handlePhoneBlur = async () => {
    setExistingProfile(null);
    if (!phone.trim()) return;

    setProfileLookupLoading(true);
    try {
      const res = await fetch(`/api/auth/otp/profile?phone=${encodeURIComponent(phone.trim())}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.exists && data.profile) {
        const profile = data.profile as ExistingProfile;
        setExistingProfile(profile);
        setName(profile.name || name);
        setAddressLine1(profile.addressLine1 || '');
        setAddressLine2(profile.addressLine2 || '');
        setCity(profile.city || '');
        setState(profile.state || '');
        setPincode(profile.pincode || '');
      }
    } catch {
      // no-op: allow manual entry
    } finally {
      setProfileLookupLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!name.trim() || !phone.trim()) {
      setError('Please fill name and mobile number.');
      return;
    }

    if (!existingProfile && (!addressLine1.trim() || !city.trim() || !state.trim() || !pincode.trim())) {
      setError('Please fill all required details.');
      return;
    }

    if (!existingProfile && !/^\d{6}$/.test(pincode.trim())) {
      setError('Enter a valid 6-digit pincode.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to send OTP.');
      } else {
        setStep('otp');
        setInfoMessage('Verification code sent to your mobile number.');
        if (data.devOtp) setDevOtp(data.devOtp);
      }
    } catch {
      setError('Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    if (!otp.trim()) {
      setError('Enter OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: phone.trim(),
          otp: otp.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'OTP verification failed.');
      } else {
        await checkAuth();
        resetForm();
        onSuccess();
      }
    } catch {
      setError('OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 text-white">
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 rounded-full p-1 transition-colors hover:bg-white/20"
              >
                <FiX size={20} />
              </button>
              <h2 className="text-xl font-bold">Quick Verify to Continue</h2>
              <p className="mt-1 text-sm text-primary-100">
                Add your details, verify by SMS OTP, and continue shopping.
              </p>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <FiAlertCircle className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {infoMessage && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  <FiCheckCircle className="flex-shrink-0" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {step === 'details' ? (
                <form onSubmit={handleRequestOtp} className="space-y-3">
                  <div className="relative">
                    <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name *"
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                      autoFocus
                    />
                  </div>
                  <div className="relative">
                    <FiPhone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={handlePhoneBlur}
                      placeholder="Mobile Number (10 digits) *"
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  {profileLookupLoading && (
                    <p className="text-xs text-gray-500">Checking your saved details...</p>
                  )}
                  {existingProfile && (
                    <p className="rounded-lg border border-green-200 bg-green-50 p-2 text-xs text-green-700">
                      We found your saved details. You can continue with OTP directly.
                    </p>
                  )}
                  {!existingProfile && (
                    <>
                      <div className="relative">
                        <FiMapPin className="pointer-events-none absolute left-3 top-3 text-gray-400" size={16} />
                        <textarea
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          placeholder="Address Line 1 *"
                          rows={2}
                          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="Address Line 2 (optional)"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City *"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="State *"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="Pincode *"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-primary-600 py-3 font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <FiLoader className="animate-spin" size={16} />
                        Sending OTP...
                      </span>
                    ) : (
                      'Send Verification Code'
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Enter the 6-digit code sent to <strong>{phone}</strong>.
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm tracking-[0.25em] focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-primary-600 py-3 font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <FiLoader className="animate-spin" size={16} />
                        Verifying...
                      </span>
                    ) : (
                      'Verify & Continue'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('details');
                      setOtp('');
                      setError('');
                      setInfoMessage('');
                    }}
                    className="w-full rounded-lg border border-gray-300 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    Edit Details
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
