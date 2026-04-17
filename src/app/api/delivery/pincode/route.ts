import { NextResponse } from 'next/server';
import { checkPincodeDelivery } from '@/lib/delivery';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get('pincode') || '';

  const result = checkPincodeDelivery(pincode);

  return NextResponse.json({
    success: true,
    pincode: pincode.trim(),
    validFormat: result.validFormat,
    available: result.available,
    message: result.message,
    estimatedDaysHint: result.estimatedDaysHint,
  });
}
