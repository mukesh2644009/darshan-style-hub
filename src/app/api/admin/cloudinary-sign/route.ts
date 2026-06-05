import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey    = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured on the server. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to Vercel environment variables.' },
        { status: 500 }
      );
    }

    const { folder } = await request.json();
    const timestamp = Math.round(Date.now() / 1000);
    const publicFolder = `darshan/${folder || 'products'}`;

    // Build the signature string — must match exactly what the browser will send
    const paramsToSign = `folder=${publicFolder}&timestamp=${timestamp}`;

    const { createHash } = await import('crypto');
    const signature = createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    return NextResponse.json({ timestamp, signature, apiKey, cloudName, folder: publicFolder });
  } catch (err) {
    console.error('Cloudinary sign error:', err);
    return NextResponse.json({ error: 'Failed to generate upload signature' }, { status: 500 });
  }
}
