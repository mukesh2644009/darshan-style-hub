import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import {
  getMyntraSheetName,
  getMyntraColumns,
  validateMyntraListing,
  MYNTRA_SHEET_GROUP_LABELS,
  type ProductWithMyntra,
  type MyntraSheetName,
} from '@/lib/myntra';

export const dynamic = 'force-dynamic';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];

function sortSizes(sizes: ProductWithMyntra['sizes']) {
  return [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.size);
    const bi = SIZE_ORDER.indexOf(b.size);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

function buildSheet(workbook: ExcelJS.Workbook, sheetName: MyntraSheetName, products: ProductWithMyntra[]) {
  const columns = getMyntraColumns(sheetName);
  const sheet = workbook.addWorksheet(sheetName);

  sheet.getCell(1, 1).value = 'Version : 13';
  for (const group of MYNTRA_SHEET_GROUP_LABELS[sheetName]) {
    sheet.getCell(2, group.col).value = group.label;
  }
  columns.forEach((col, idx) => {
    const cell = sheet.getCell(3, idx + 1);
    cell.value = col.header;
    cell.font = { bold: true };
    if (col.mandatory) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    }
  });

  let rowNum = 4;
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
        myntraListingDetail: { include: { sizeMeasurements: true } },
      },
    }) as ProductWithMyntra[];

    const foundIds = new Set(products.map((p) => p.id));
    const notFound = productIds.filter((id) => !foundIds.has(id));
    if (notFound.length > 0) {
      return NextResponse.json({ error: `Product(s) not found: ${notFound.join(', ')}` }, { status: 404 });
    }

    const validationErrors: { productId: string; sku: string; name: string; missingFields: { field: string; label: string }[] }[] = [];
    for (const product of products) {
      const missing = validateMyntraListing(product);
      if (missing.length > 0) {
        validationErrors.push({ productId: product.id, sku: product.sku, name: product.name, missingFields: missing });
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'One or more products are missing required Myntra fields', details: validationErrors },
        { status: 422 }
      );
    }

    const bySheet = new Map<MyntraSheetName, ProductWithMyntra[]>();
    for (const product of products) {
      const sheet = getMyntraSheetName(product.category);
      if (!sheet) continue; // already caught by validation above, unreachable in practice
      const list = bySheet.get(sheet) || [];
      list.push(product);
      bySheet.set(sheet, list);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Darshan Style Hub';
    workbook.created = new Date();
    for (const [sheetName, sheetProducts] of Array.from(bySheet.entries())) {
      buildSheet(workbook, sheetName, sheetProducts);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = products.length === 1
      ? `Myntra-Export-${products[0].sku}.xlsx`
      : `Myntra-Export-${products.length}-products-${Date.now()}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Myntra export error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Export failed' }, { status: 500 });
  }
}
