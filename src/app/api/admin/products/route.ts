import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { slugify, generateUniqueSlug } from '@/lib/slug';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { 
      sku, 
      name, 
      description, 
      price, 
      originalPrice, 
      category, 
      subcategory, 
      featured,
      newArrival,
      visibleOnSite,
      afNumber,
      images,
      sizes,
      colors,
      myntra,
      myntraSizeMeasurements,
    } = body;

    // Validate required fields
    if (!sku || !name || !description || price === undefined || !category) {
      return NextResponse.json(
        { error: 'SKU, name, description, price, and category are required' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku }
    });

    if (existingSku) {
      return NextResponse.json(
        { error: 'SKU already exists. Please use a unique SKU.' },
        { status: 400 }
      );
    }

    // Validate price is positive
    if (price < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      );
    }

    // Generate SEO-friendly slug
    const baseSlug = slugify(name);
    const existingSlugs = await prisma.product.findMany({
      where: { slug: { not: null } },
      select: { slug: true }
    }).then(rows => rows.map(r => r.slug).filter(Boolean) as string[]);
    const slug = generateUniqueSlug(baseSlug, existingSlugs);

    // Compute inStock from sizes so sarees with quantity > 0 start as in-stock
    const totalQtyFromSizes = sizes && sizes.length > 0
      ? sizes.reduce((sum: number, s: { size: string; quantity: number } | string) => {
          if (typeof s === 'string') return sum;
          return sum + (s.quantity || 0);
        }, 0)
      : 0;

    // Create product with related data
    const product = await prisma.product.create({
      data: {
        sku,
        slug,
        name,
        description,
        price: parseFloat(price.toString()),
        originalPrice: originalPrice ? parseFloat(originalPrice.toString()) : null,
        category,
        subcategory: subcategory || '',
        featured: Boolean(featured),
        newArrival: Boolean(newArrival),
        // Defaults to visible so omitting this in a request never silently hides a product.
        visibleOnSite: visibleOnSite === undefined ? true : Boolean(visibleOnSite),
        afNumber: afNumber || null,
        inStock: totalQtyFromSizes > 0,
        images: images && images.length > 0 ? {
          create: images.map((url: string) => ({ url }))
        } : undefined,
        sizes: sizes && sizes.length > 0 ? {
          create: sizes.map((s: { size: string; quantity: number } | string) => {
            if (typeof s === 'string') {
              return { size: s, quantity: 0 };
            }
            return { size: s.size, quantity: s.quantity || 0 };
          })
        } : undefined,
        colors: colors && colors.length > 0 ? {
          create: colors.map((color: { name: string; hex: string }) => ({ 
            name: color.name, 
            hex: color.hex 
          }))
        } : undefined,
      },
      include: {
        images: true,
        sizes: true,
        colors: true,
      },
    });

    // Create Myntra listing details, if provided (optional metadata)
    if (myntra && typeof myntra === 'object' && Object.values(myntra).some((v) => typeof v === 'string' && v.trim())) {
      const detail = await prisma.myntraListingDetail.create({
        data: { productId: product.id, ...myntra },
      });

      if (Array.isArray(myntraSizeMeasurements)) {
        for (const m of myntraSizeMeasurements) {
          if (!m.size) continue;
          const hasAny = ['bust', 'chest', 'frontLength', 'garmentWaist', 'inseamLength', 'toFitWaist']
            .some((f) => m[f] !== '' && m[f] != null);
          if (!hasAny) continue;
          await prisma.myntraSizeMeasurement.create({
            data: {
              myntraListingDetailId: detail.id,
              size: m.size,
              bust: m.bust !== '' && m.bust != null ? parseFloat(m.bust) : null,
              chest: m.chest !== '' && m.chest != null ? parseFloat(m.chest) : null,
              frontLength: m.frontLength !== '' && m.frontLength != null ? parseFloat(m.frontLength) : null,
              garmentWaist: m.garmentWaist !== '' && m.garmentWaist != null ? parseFloat(m.garmentWaist) : null,
              inseamLength: m.inseamLength !== '' && m.inseamLength != null ? parseFloat(m.inseamLength) : null,
              toFitWaist: m.toFitWaist !== '' && m.toFitWaist != null ? parseFloat(m.toFitWaist) : null,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
