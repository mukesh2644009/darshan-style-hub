'use client';

import { useState } from 'react';
import { FiAlertCircle, FiLoader, FiMail, FiMapPin, FiPhone, FiUser, FiX } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { CartItem } from '@/store/cartStore';

interface QuickSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cartItems?: CartItem[];
  cartTotal?: number;
}

type ExistingProfile = {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
};

export default function QuickSignupModal({ isOpen, onClose, onSuccess, cartItems = [], cartTotal = 0 }: QuickSignupModalProps) {
  const { checkAuth } = useAuthStore();

  // Save the cart for abandoned-cart email recovery (fire-and-forget)
  const saveAbandonedCart = (customerEmail: string, customerName: string, customerPhone: string) => {
    console.log('[AbandonedCart] saveAbandonedCart called', { email: customerEmail, itemsCount: cartItems.length, total: cartTotal });
    if (!customerEmail.trim() || cartItems.length === 0) {
      console.log('[AbandonedCart] skipped — email empty or no items');
      return;
    }
    fetch('/api/abandoned-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        email: customerEmail.trim(),
        name: customerName.trim() || undefined,
        phone: customerPhone.trim() || undefined,
        items: cartItems,
        total: cartTotal,
      }),
    }).catch(() => {});
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLookupLoading, setProfileLookupLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<ExistingProfile | null>(null);

  // Verified-account flow — a phone number matching an existing real account
  // must prove ownership via an emailed OTP before we log in as that account.
  const [needsVerification, setNeedsVerification] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setState('');
    setPincode('');
    setError('');
    setProfileLookupLoading(false);
    setExistingProfile(null);
    setLoading(false);
    setPincodeLoading(false);
    setPincodeError('');
    setNeedsVerification(false);
    setOtpStep(false);
    setOtpCode('');
    setMaskedEmail('');
    setOtpLoading(false);
  };

  const handlePincodeChange = async (val: string) => {
    setPincode(val);
    setPincodeError('');
    if (val.length !== 6 || !/^\d{6}$/.test(val)) {
      if (val.length > 0 && val.length < 6) {
        setCity('');
        setState('');
      }
      return;
    }
    setPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
      const data = await res.json();
      const po = data?.[0]?.PostOffice?.[0];
      if (data?.[0]?.Status === 'Success' && po) {
        setCity(po.District || po.Name || '');
        setState(po.State || '');
      } else {
        setCity('');
        setState('');
        setPincodeError('Pincode not found. Please enter city & state manually.');
      }
    } catch {
      setPincodeError('Could not verify pincode. Please fill city & state manually.');
    } finally {
      setPincodeLoading(false);
    }
  };

  const handlePhoneBlur = async () => {
    setExistingProfile(null);
    setNeedsVerification(false);
    if (!phone.trim()) return;
    setProfileLookupLoading(true);
    try {
      const res = await fetch(`/api/auth/otp/profile?phone=${encodeURIComponent(phone.trim())}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.exists && data.requiresVerification) {
        setNeedsVerification(true);
        setMaskedEmail(data.maskedEmail || '');
      } else if (data.success && data.exists && data.profile) {
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
      // allow manual entry
    } finally {
      setProfileLookupLoading(false);
    }
  };

  const handleClose = () => {
    // If they typed an email but are closing without submitting, still save the cart
    saveAbandonedCart(email, name, phone);
    resetForm();
    onClose();
  };

  const requestVerificationOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(
          data.error === 'no_email'
            ? 'This account has no email on file to verify with. Please contact support.'
            : 'Could not send a verification code. Please try again.'
        );
        return;
      }
      setMaskedEmail(data.maskedEmail || maskedEmail);
      setOtpStep(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim()) {
      setError('Please fill your name and mobile number.');
      return;
    }

    // This phone belongs to a verified account — prove ownership via email OTP
    // instead of logging straight in.
    if (needsVerification) {
      await requestVerificationOtp();
      return;
    }

    if (!existingProfile && (!addressLine1.trim() || !city.trim() || !state.trim() || !pincode.trim())) {
      setError('Please fill all delivery details.');
      return;
    }

    if (!existingProfile && !/^\d{6}$/.test(pincode.trim())) {
      setError('Enter a valid 6-digit pincode.');
      return;
    }

    // Save abandoned cart before login attempt so reminders work even if login fails
    saveAbandonedCart(email, name, phone);

    setLoading(true);
    try {
      const res = await fetch('/api/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          addressLine1: (existingProfile?.addressLine1 || addressLine1).trim(),
          addressLine2: (existingProfile?.addressLine2 || addressLine2).trim(),
          city: (existingProfile?.city || city).trim(),
          state: (existingProfile?.state || state).trim(),
          pincode: (existingProfile?.pincode || pincode).trim(),
        }),
      });
      const data = await res.json();
      if (!data.success && data.error === 'verification_required') {
        // Server caught it even though the blur check didn't (e.g. autofill without blur firing)
        setNeedsVerification(true);
        setMaskedEmail(data.maskedEmail || '');
        setLoading(false);
        await requestVerificationOtp();
        return;
      }
      if (!data.success) {
        setError(data.error || 'Failed to continue. Please try again.');
      } else {
        await checkAuth();
        resetForm();
        onSuccess();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/login-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: phone.trim(),
          otp: otpCode.trim(),
          addressLine1: addressLine1.trim() || undefined,
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          pincode: pincode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Invalid code. Please try again.');
        return;
      }
      await checkAuth();
      resetForm();
      onSuccess();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setOtpLoading(false);
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
              <h2 className="text-xl font-bold">Quick Details to Continue</h2>
              <p className="mt-1 text-sm text-primary-100">
                Add your details to save your cart and continue shopping.
              </p>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <FiAlertCircle className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {otpStep ? (
                <form onSubmit={handleOtpSubmit} className="space-y-3">
                  <p className="text-sm text-gray-600">
                    We emailed a 6-digit code to <strong>{maskedEmail}</strong> to confirm it&apos;s you.
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    className="w-full rounded-lg border border-gray-300 py-2.5 px-4 text-center text-lg tracking-[0.5em] focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full rounded-lg bg-primary-600 py-3 font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {otpLoading ? (
                      <span className="inline-flex items-center gap-2 justify-center">
                        <FiLoader className="animate-spin" size={16} />
                        Verifying...
                      </span>
                    ) : (
                      'Verify & Continue'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={requestVerificationOtp}
                    disabled={loading}
                    className="w-full text-center text-xs text-gray-500 hover:text-primary-600"
                  >
                    Didn&apos;t get the code? Resend
                  </button>
                </form>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
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
                <div className="relative">
                  <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {profileLookupLoading && (
                  <p className="text-xs text-gray-500">Checking your saved details...</p>
                )}

                {needsVerification && (
                  <p className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs text-blue-700">
                    This number is linked to an existing account. We&apos;ll email a code to {maskedEmail || 'your registered email'} to confirm it&apos;s you.
                  </p>
                )}

                {existingProfile ? (
                  <p className="rounded-lg border border-green-200 bg-green-50 p-2 text-xs text-green-700">
                    Welcome back! We found your saved delivery details.
                  </p>
                ) : (
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
                    <div className="relative">
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        placeholder="Pincode * (auto-fills city & state)"
                        maxLength={6}
                        className={`w-full rounded-lg border px-4 py-2.5 pr-24 text-sm transition-colors focus:ring-2 ${
                          pincodeError
                            ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-200'
                            : city && state && pincode.length === 6
                              ? 'border-green-400 bg-green-50 focus:border-green-400 focus:ring-green-200'
                              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                        {pincodeLoading && <span className="text-gray-400">Fetching…</span>}
                        {!pincodeLoading && pincodeError && <span className="text-red-500">✗ Invalid</span>}
                        {!pincodeLoading && !pincodeError && city && state && pincode.length === 6 && (
                          <span className="text-green-600">✓ Found</span>
                        )}
                      </span>
                    </div>
                    {pincodeError && (
                      <p className="flex items-center gap-1.5 text-xs text-red-600 -mt-1">
                        <FiAlertCircle size={12} className="shrink-0" />
                        {pincodeError}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
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
                      {needsVerification ? 'Sending code...' : 'Saving...'}
                    </span>
                  ) : needsVerification ? (
                    'Send Verification Code'
                  ) : (
                    'Continue Shopping'
                  )}
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
