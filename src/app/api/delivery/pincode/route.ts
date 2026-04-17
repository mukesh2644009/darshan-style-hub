import { NextResponse } from 'next/server';
import { checkPincodeDelivery } from '@/lib/delivery';
import { verifyIndianPincode } from '@/lib/delivery-indiapost';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get('pincode') || '';

  const result = checkPincodeDelivery(pincode);

  if (!result.validFormat || !result.available) {
    return NextResponse.json({
      success: true,
      pincode: pincode.trim(),
      validFormat: result.validFormat,
      available: result.available,
      message: result.message,
      estimatedDaysHint: result.estimatedDaysHint,
    });
  }

  const verified = await verifyIndianPincode(pincode);

  if (!verified.ok && verified.reason === 'not_found') {
    return NextResponse.json({
      success: true,
      pincode: pincode.trim(),
      validFormat: true,
      available: false,
      message:
        'This pincode was not found in India Post records. Please check the digits and try again.',
      estimatedDaysHint: undefined,
    });
  }

  const locationHint =
    verified.ok && (verified.district || verified.state)
      ? [verified.district, verified.state].filter(Boolean).join(', ')
      : undefined;

  return NextResponse.json({
    success: true,
    pincode: pincode.trim(),
    validFormat: true,
    available: true,
    locationHint,
    message: result.message,
    estimatedDaysHint: result.estimatedDaysHint,
  });
}
