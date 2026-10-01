import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import {
  templateKeyFor,
  columnsAndSheetFor,
  validateFlipkartListing,
  type ProductWithFlipkart,
} from '@/lib/flipkart';

export const dynamic = 'force-dynamic';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', 'Free Size'];

function sortSizes(sizes: ProductWithFlipkart['sizes']) {
  return [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.size);
    const bi = SIZE_ORDER.indexOf(b.size);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const productIds: string[] = Array.isArray(body.productIds)
      ? body.productIds
      : body.productId
        ? [body.productId]
        : [];

    if (productIds.length === 0) {
      return NextResponse.json({ error: 'productId or productIds is required' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: { orderBy: { id: 'asc' } },
        sizes: true,
        colors: true,
        flipkartListingDetail: true,
      },
    }) as ProductWithFlipkart[];

    const foundIds = new Set(products.map((p) => p.id));
    const notFound = productIds.filter((id) => !foundIds.has(id));
    if (notFound.length > 0) {
      return NextResponse.json({ error: `Product(s) not found: ${notFound.join(', ')}` }, { status: 404 });
    }

    const validationErrors: { productId: string; sku: string; name: string; missingFields: { field: string; label: string }[] }[] = [];
    for (const product of products) {
      const missing = validateFlipkartListing(product);
      if (missing.length > 0) {
        validationErrors.push({ productId: product.id, sku: product.sku, name: product.name, missingFields: missing });
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'One or more products are missing required Flipkart fields', details: validationErrors },
        { status: 422 }
      );
    }

    const templateKeys = new Set(products.map(templateKeyFor));
    if (templateKeys.size > 1) {
      return NextResponse.json(
        { error: `Selected products need different Flipkart templates (${Array.from(templateKeys).join(', ')}) — export one template group at a time. Note: "Kurtis" splits into single-piece kurtis and kurta+bottom sets, which use different templates.` },
        { status: 422 }
      );
    }

    const { columns, sheetName } = columnsAndSheetFor(templateKeyFor(products[0]));

    // Flipkart's own downloaded templates are legacy .xls, but their bulk
    // uploader is very likely backed by Apache POI (standard for Java-based
    // sellers tooling), which reads both .xls and .xlsx — so we keep .xlsx here
    // for full content fidelity (SheetJS's free .xls writer truncates any cell
    // over 255 characters, which would mutilate the long Description/Key
    // Features fields). Pending a real upload test to confirm Flipkart accepts
    // it; if not, revisit — see project_darshan_flipkart_categories memory.
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Darshan Style Hub';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet(sheetName);

    columns.forEach((col, idx) => {
      const cell = sheet.getCell(1, idx + 1);
      cell.value = col.header;
      cell.font = { bold: true };
    });

    let rowNum = 2;
    for (const product of products) {
      for (const size of sortSizes(product.sizes)) {
        const rowValues = columns.map((col) => col.get({ product, size }));
        sheet.getRow(rowNum).values = rowValues;
        rowNum += 1;
      }
    }

    columns.forEach((col, idx) => {
      sheet.getColumn(idx + 1).width = Math.min(40, Math.max(12, col.header.length + 2));
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = products.length === 1
      ? `Flipkart-Export-${products[0].sku}.xlsx`
      : `Flipkart-Export-${products.length}-products-${Date.now()}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Flipkart export error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Export failed' }, { status: 500 });
  }
}
