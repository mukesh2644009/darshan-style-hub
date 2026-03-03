import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { trackViewContent } from '@/lib/facebook-capi';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        sizes: true,
        colors: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const ua = request.headers.get('user-agent') || '';
    trackViewContent(
      product.id,
      product.name,
      product.category,
      product.price,
      `https://darshanstylehub.com/products/${product.id}`,
      { clientIpAddress: ip, clientUserAgent: ua }
    ).catch(() => {});

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
