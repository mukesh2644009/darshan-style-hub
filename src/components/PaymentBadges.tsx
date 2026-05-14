import { FiLock } from 'react-icons/fi';

// ─── Individual payment method SVG badges ─────────────────────────────────────
// All drawn inline — no external images required.

function UPIBadge() {
  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm select-none">
      {/* UPI official purple/green */}
      <svg width="28" height="14" viewBox="0 0 56 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="UPI">
        <rect width="56" height="24" rx="3" fill="white"/>
        <text x="6" y="17" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="13" fill="#5B2D8E">U</text>
        <text x="18" y="17" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="13" fill="#00A650">P</text>
        <text x="30" y="17" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="13" fill="#5B2D8E">I</text>
      </svg>
      <span className="text-[10px] font-bold text-gray-500 tracking-wider hidden sm:inline">UPI</span>
    </div>
  );
}

function RazorpayBadge() {
  return (
    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm select-none">
      {/* Razorpay blue lightning */}
      <svg width="14" height="16" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Razorpay">
        <path d="M8 0L2 10h5l-1 8 7-12H8l2-6z" fill="#3395FF"/>
      </svg>
      <span className="text-[10px] font-bold text-[#3395FF] tracking-wide">Razorpay</span>
    </div>
  );
}

function VisaBadge() {
  return (
    <div className="bg-[#1A1F71] rounded-lg px-3 py-1.5 shadow-sm select-none">
      <svg width="38" height="14" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
        <text x="0" y="16" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="18" fill="white" letterSpacing="-1">VISA</text>
      </svg>
    </div>
  );
}

function MastercardBadge() {
  return (
    <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm select-none">
      <svg width="30" height="18" viewBox="0 0 46 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
        <circle cx="16" cy="14" r="13" fill="#EB001B"/>
        <circle cx="30" cy="14" r="13" fill="#F79E1B"/>
        <path d="M23 5.15a13 13 0 0 1 0 17.7A13 13 0 0 1 23 5.15z" fill="#FF5F00"/>
      </svg>
    </div>
  );
}

function RuPayBadge() {
  return (
    <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm select-none gap-1">
      {/* RuPay tricolour accent */}
      <svg width="6" height="14" viewBox="0 0 6 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect width="6" height="6" fill="#FF9933"/>
        <rect y="6" width="6" height="6" fill="white"/>
        <rect y="12" width="6" height="6" fill="#138808"/>
      </svg>
      <span className="text-[10px] font-extrabold text-gray-700">RuPay</span>
    </div>
  );
}

function CODBadge() {
  return (
    <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5 shadow-sm select-none">
      <span className="text-green-600 text-xs">💵</span>
      <span className="text-[10px] font-bold text-green-700">Cash on Delivery</span>
    </div>
  );
}

function GPayBadge() {
  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm select-none">
      {/* Google G multicolor */}
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.77h5.4a4.62 4.62 0 0 1-2 3.04v2.52h3.24c1.9-1.74 3-4.3 3-7.33z" fill="#4285F4"/>
        <path d="M10 20c2.7 0 4.97-.9 6.62-2.44l-3.23-2.52c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H1.07v2.6A9.99 9.99 0 0 0 10 20z" fill="#34A853"/>
        <path d="M4.4 11.88A6.03 6.03 0 0 1 4.08 10c0-.65.1-1.3.31-1.88V5.52H1.07A9.98 9.98 0 0 0 0 10c0 1.6.38 3.12 1.07 4.48l3.33-2.6z" fill="#FBBC05"/>
        <path d="M10 3.96c1.46 0 2.78.5 3.81 1.5l2.86-2.86A9.97 9.97 0 0 0 10 0 9.99 9.99 0 0 0 1.07 5.52l3.33 2.6C5.2 5.72 7.4 3.96 10 3.96z" fill="#EA4335"/>
      </svg>
      <span className="text-[10px] font-bold text-gray-600">GPay</span>
    </div>
  );
}

function PhonePeBadge() {
  return (
    <div className="flex items-center gap-1.5 bg-[#5F259F] rounded-lg px-2.5 py-1.5 shadow-sm select-none">
      {/* PhonePe P */}
      <svg width="12" height="14" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M2 0h6a6 6 0 0 1 0 12H6v6H2V0zm4 8h2a2 2 0 0 0 0-4H6v4z" fill="white"/>
      </svg>
      <span className="text-[10px] font-bold text-white">PhonePe</span>
    </div>
  );
}

function PaytmBadge() {
  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm select-none">
      <div className="flex gap-0.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#00BAF2]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#002970]" />
      </div>
      <span className="text-[10px] font-bold text-[#002970]">Paytm</span>
    </div>
  );
}

// ─── Public composite components ──────────────────────────────────────────────

/**
 * `variant="footer"` — wide horizontal wrap, dark background
 * `variant="pdp"` — compact horizontal strip on product page
 * `variant="checkout"` — tight inline strip inside order summary
 */
export type BadgeVariant = 'footer' | 'pdp' | 'checkout';

interface PaymentBadgesProps {
  variant?: BadgeVariant;
}

export default function PaymentBadges({ variant = 'pdp' }: PaymentBadgesProps) {
  if (variant === 'footer') {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
          <FiLock size={12} /> Secure Payments
        </p>
        <div className="flex flex-wrap gap-2">
          <UPIBadge />
          <GPayBadge />
          <PhonePeBadge />
          <PaytmBadge />
          <VisaBadge />
          <MastercardBadge />
          <RuPayBadge />
          <CODBadge />
        </div>
        <p className="text-xs text-accent-500 flex items-center gap-1">
          <FiLock size={10} />
          All transactions are encrypted &amp; secured by Razorpay
        </p>
      </div>
    );
  }

  if (variant === 'checkout') {
    return (
      <div className="flex items-center flex-wrap gap-1.5 py-2 border-t border-accent-200">
        <FiLock size={11} className="text-green-500 shrink-0" />
        <span className="text-[10px] text-gray-400 font-medium mr-1">Secured by</span>
        <RazorpayBadge />
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <UPIBadge />
        <GPayBadge />
        <VisaBadge />
        <MastercardBadge />
        <CODBadge />
      </div>
    );
  }

  // pdp (default)
  return (
    <div className="flex items-center flex-wrap gap-1.5">
      <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mr-1">
        <FiLock size={10} className="text-green-500" /> Pay with
      </span>
      <UPIBadge />
      <GPayBadge />
      <PhonePeBadge />
      <PaytmBadge />
      <VisaBadge />
      <MastercardBadge />
      <RuPayBadge />
      <CODBadge />
    </div>
  );
}
