type PendingProfile = {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
};

type OtpRecord = {
  code: string;
  expiresAt: number;
  attempts: number;
  profile: PendingProfile;
};

// Use a global to survive Next.js hot-reloads in development
const globalForOtp = global as typeof globalThis & { otpStore?: Map<string, OtpRecord> };
const otpStore: Map<string, OtpRecord> =
  globalForOtp.otpStore ?? (globalForOtp.otpStore = new Map<string, OtpRecord>());
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

export function normalizeIndianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith('091')) return `+${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  return null;
}

export function createOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function saveOtp(phone: string, code: string, profile: PendingProfile): void {
  otpStore.set(phone, {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    profile,
  });
}

export function verifyOtp(phone: string, code: string): { ok: boolean; reason?: string; profile?: PendingProfile } {
  const record = otpStore.get(phone);
  if (!record) return { ok: false, reason: 'No OTP request found. Please request a new code.' };
  if (record.expiresAt < Date.now()) {
    otpStore.delete(phone);
    return { ok: false, reason: 'OTP expired. Please request a new code.' };
  }
  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(phone);
    return { ok: false, reason: 'Too many invalid attempts. Please request a new OTP.' };
  }

  if (record.code !== code) {
    record.attempts += 1;
    return { ok: false, reason: 'Invalid OTP code.' };
  }

  otpStore.delete(phone);
  return { ok: true, profile: record.profile };
}

function toWhatsAppRecipient(phone: string): string {
  return phone.replace(/\D/g, '');
}

async function sendWhatsAppOtp(phone: string, otp: string): Promise<{ sent: boolean }> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || 'en';

  if (!accessToken || !phoneNumberId) {
    return { sent: false };
  }

  const to = toWhatsAppRecipient(phone);
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  const templatePayload = templateName
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: otp }],
            },
          ],
        },
      }
    : null;

  const textPayload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: {
      body: `Darshan Style Hub verification code: ${otp}. It expires in 10 minutes.`,
    },
  };

  const trySend = async (payload: Record<string, unknown>) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const details = await response.text();
      console.error('[otp] WhatsApp send failed:', details);
      return false;
    }
    return true;
  };

  if (templatePayload) {
    const templateSuccess = await trySend(templatePayload);
    if (templateSuccess) return { sent: true };
  }

  const textSuccess = await trySend(textPayload);
  return { sent: textSuccess };
}

async function sendWhatsAppTextMessage(phone: string, body: string): Promise<boolean> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) return false;

  const to = toWhatsAppRecipient(phone);
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error('[owner-notification] WhatsApp send failed:', details);
    return false;
  }
  return true;
}

async function sendFast2SmsOtp(phone: string, otp: string): Promise<boolean> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return false;

  // Fast2SMS Quick SMS (OTP) route — no DLT required
  const mobile = phone.replace(/\D/g, '').slice(-10); // last 10 digits
  const message = `${otp} is your Darshan Style Hub verification code. Valid for 10 minutes.`;

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'q',        // Quick SMS route (no DLT needed)
      message,
      language: 'english',
      flash: 0,
      numbers: mobile,
    }),
  });

  const data = await response.json().catch(() => ({}));
  console.log('[otp] Fast2SMS response:', JSON.stringify(data));

  if (data?.return === true) {
    return true;
  }

  console.error('[otp] Fast2SMS failed:', JSON.stringify(data));
  return false;
}

async function sendMsg91Otp(phone: string, otp: string): Promise<boolean> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const sender = process.env.MSG91_SENDER_ID;

  if (!authKey || !templateId) {
    return false;
  }

  const mobile = toWhatsAppRecipient(phone);

  const response = await fetch('https://control.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      authkey: authKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mobile,
      template_id: templateId,
      otp,
      otp_length: 6,
      otp_expiry: 10,
      sender,
      realTimeResponse: 1,
    }),
  });

  if (response.ok) {
    const data = await response.json().catch(() => ({}));
    console.log('[otp] MSG91 response:', JSON.stringify(data));
    if (data?.type === 'success' || data?.message === 'success') return true;
    console.error('[otp] MSG91 non-success:', data);
  } else {
    console.error('[otp] MSG91 failed:', await response.text());
  }
  return false;
}

export async function sendSmsOtp(phone: string, otp: string): Promise<{ sent: boolean; debugMessage?: string }> {
  const isDev = process.env.NODE_ENV !== 'production';

  // Try Fast2SMS first (no DLT needed)
  const fast2SmsSent = await sendFast2SmsOtp(phone, otp);
  if (fast2SmsSent) {
    return { sent: true };
  }

  // Fallback to MSG91
  const msg91Sent = await sendMsg91Otp(phone, otp);
  if (msg91Sent) {
    return { sent: true };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;
  const isProduction = process.env.NODE_ENV === 'production';

  const body = `Darshan Style Hub verification code: ${otp}. It expires in 10 minutes.`;

  if (!accountSid || !authToken || !fromPhone) {
    if (isProduction) {
      console.error('[otp] SMS provider not configured in production.');
      return { sent: false };
    }
    console.log(`[otp-dev] SMS provider not configured. OTP for ${phone}: ${otp}`);
    return {
      sent: true,
      debugMessage: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const form = new URLSearchParams();
  form.set('To', phone);
  form.set('From', fromPhone);
  form.set('Body', body);

  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error('[otp] Twilio send failed:', details);
    return { sent: false };
  }

  return { sent: true };
}

export async function sendOtpCode(phone: string, otp: string): Promise<{ sent: boolean; channel?: 'whatsapp' | 'sms'; debugMessage?: string }> {
  const whatsapp = await sendWhatsAppOtp(phone, otp);
  if (whatsapp.sent) {
    return { sent: true, channel: 'whatsapp' };
  }

  const sms = await sendSmsOtp(phone, otp);
  if (sms.sent) {
    return { sent: true, channel: 'sms', debugMessage: sms.debugMessage };
  }

  return { sent: false };
}

export async function notifyOwnerNewMember(details: {
  customerName: string;
  customerPhone: string;
  city?: string;
  state?: string;
  pincode?: string;
}): Promise<void> {
  const ownerPhone = process.env.OWNER_WHATSAPP_NUMBER || '+919019076335';
  const message =
    `New member joined Darshan Style Hub.\n` +
    `Name: ${details.customerName}\n` +
    `Phone: ${details.customerPhone}\n` +
    `Location: ${details.city || '-'}, ${details.state || '-'} ${details.pincode || ''}`.trim();

  const sent = await sendWhatsAppTextMessage(ownerPhone, message);
  if (!sent) {
    console.log('[owner-notification] Could not send WhatsApp owner notification.');
  }
}
