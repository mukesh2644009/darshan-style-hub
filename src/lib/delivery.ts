/**
 * Pincode delivery rules. Configure via env:
 * - DELIVERY_PINCODE_MODE=all_india | allowlist
 * - DELIVERY_ALLOWLIST_PINCODES=comma-separated (required for allowlist mode when set)
 * - DELIVERY_BLOCKLIST_PINCODES=comma-separated pincodes we never ship to
 */

export type DeliveryCheckResult = {
  validFormat: boolean;
  available: boolean;
  message: string;
  /** Hint for UI; not a guarantee from courier API */
  estimatedDaysHint?: string;
};

function parseList(envVal: string | undefined): string[] {
  if (!envVal?.trim()) return [];
  return envVal
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const BLOCKLIST = parseList(process.env.DELIVERY_BLOCKLIST_PINCODES);
const ALLOWLIST = parseList(process.env.DELIVERY_ALLOWLIST_PINCODES);
const MODE = (process.env.DELIVERY_PINCODE_MODE || 'all_india').toLowerCase();

const PIN_RE = /^[1-9]\d{5}$/;

export function checkPincodeDelivery(pincode: string): DeliveryCheckResult {
  const normalized = pincode.trim();

  if (!PIN_RE.test(normalized)) {
    return {
      validFormat: false,
      available: false,
      message: 'Please enter a valid 6-digit Indian pincode.',
    };
  }

  if (BLOCKLIST.includes(normalized)) {
    return {
      validFormat: true,
      available: false,
      message:
        'We do not deliver to this pincode at the moment. Please WhatsApp us — we may still help with special requests.',
    };
  }

  if (MODE === 'allowlist' && ALLOWLIST.length > 0 && !ALLOWLIST.includes(normalized)) {
    return {
      validFormat: true,
      available: false,
      message:
        'Delivery is not enabled for this pincode online yet. Message us on WhatsApp and we will check manually.',
    };
  }

  return {
    validFormat: true,
    available: true,
    message: 'Yes — we can deliver to your area.',
    estimatedDaysHint: 'Most orders reach within 3–7 business days after dispatch.',
  };
}
