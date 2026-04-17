/**
 * Optional verification against India Post data via public API (not affiliated with India Post).
 * Used so format-valid but non-existent pincodes (e.g. 121212) show an error.
 */

export type IndiaPostVerifyResult =
  | { ok: true; state?: string; district?: string }
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'service_error' };

export async function verifyIndianPincode(pincode: string): Promise<IndiaPostVerifyResult> {
  const clean = pincode.replace(/\D/g, '').slice(0, 6);
  if (clean.length !== 6) {
    return { ok: false, reason: 'not_found' };
  }

  try {
    const res = await fetch(
      `https://api.postalpincode.in/pincode/${encodeURIComponent(clean)}`,
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: 86400 },
      },
    );
    if (!res.ok) {
      return { ok: false, reason: 'service_error' };
    }
    const data: unknown = await res.json();
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== 'object') {
      return { ok: false, reason: 'service_error' };
    }
    const status = (row as { Status?: string }).Status;
    const offices = (row as { PostOffice?: unknown[] }).PostOffice;
    if (status !== 'Success' || !Array.isArray(offices) || offices.length === 0) {
      return { ok: false, reason: 'not_found' };
    }
    const first = offices[0] as { State?: string; District?: string };
    return {
      ok: true,
      state: first.State,
      district: first.District,
    };
  } catch {
    return { ok: false, reason: 'service_error' };
  }
}
