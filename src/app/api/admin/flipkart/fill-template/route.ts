import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import {
  templateKeyFor,
  columnsAndSheetFor,
  validateFlipkartListing,
  type ProductWithFlipkart,
} from '@/lib/flipkart';
import { isExcelAvailable, fillWithExcel } from '@/lib/excelComFill';
import { platformPrice, markupLabel } from '@/lib/platformPricing';

type CellWrite = { r: number; c: number; v: string | number; label: string };

export const dynamic = 'force-dynamic';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', 'Free Size'];

function sortSizes(sizes: ProductWithFlipkart['sizes']) {
  return [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.size);
    const bi = SIZE_ORDER.indexOf(b.size);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

// Every real Flipkart template we've inspected (Suit, Kurti, Ethnic Set,
// Co-Ord's apparel_set) has the same 4-row header block before real data:
// row1 = column names, row2 = data-type hints, row3 = sample/example row,
// row4 = field descriptions — real data starts at row5 (index 4, 0-based).
const DATA_START_ROW_INDEX = 4;

// SheetJS's free .xls writer truncates any cell over 255 characters — a real
// limitation of the library, not Flipkart's own field limits (confirmed
// 2026-09-24). Truncate safely at a word boundary rather than silently
// mangling text mid-word, and report every field this happened to.
const XLS_CELL_CHAR_LIMIT = 255;
function safeTruncate(value: string): { value: string; truncated: boolean } {
  if (value.length <= XLS_CELL_CHAR_LIMIT) return { value, truncated: false };
  const cut = value.slice(0, XLS_CELL_CHAR_LIMIT - 3);
  const lastSpace = cut.lastIndexOf(' ');
  const safeCut = lastSpace > XLS_CELL_CHAR_LIMIT * 0.7 ? cut.slice(0, lastSpace) : cut;
  return { value: `${safeCut}...`, truncated: true };
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const form = await request.formData();
    const file = form.get('file');
    const productIdsRaw = form.get('productIds');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required (the blank template downloaded from Flipkart)' }, { status: 400 });
    }
    if (typeof productIdsRaw !== 'string') {
      return NextResponse.json({ error: 'productIds is required' }, { status: 400 });
    }

    let productIds: string[];
    try {
      productIds = JSON.parse(productIdsRaw);
    } catch {
      return NextResponse.json({ error: 'productIds must be a JSON array' }, { status: 400 });
    }
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'productIds must be a non-empty array' }, { status: 400 });
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
        { error: `Selected products need different Flipkart templates (${Array.from(templateKeys).join(', ')}) — fill one template group at a time.` },
        { status: 422 }
      );
    }

    const { columns, sheetName } = columnsAndSheetFor(templateKeyFor(products[0]));

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: 'buffer', cellStyles: false });

    if (!workbook.SheetNames.includes(sheetName)) {
      return NextResponse.json(
        { error: `Uploaded file doesn't look like the right template — expected a sheet named "${sheetName}" (for ${products[0].category}), but found: ${workbook.SheetNames.join(', ')}. Make sure you uploaded the correct blank template for this category.` },
        { status: 422 }
      );
    }

    const sheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

    // Map our known column headers to this specific file's actual column
    // index — don't assume fixed positions, since Flipkart occasionally
    // reorders/adds columns between template versions.
    const headerToColIndex = new Map<string, number>();
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: 0, c })];
      if (cell && typeof cell.v === 'string' && cell.v.trim()) {
        headerToColIndex.set(cell.v.trim(), c);
      }
    }

    const unmatchedHeaders = columns.filter((col) => !headerToColIndex.has(col.header)).map((col) => col.header);

    const writes: CellWrite[] = [];
    let rowIndex = DATA_START_ROW_INDEX;
    for (const product of products) {
      for (const size of sortSizes(product.sizes)) {
        for (const col of columns) {
          const colIdx = headerToColIndex.get(col.header);
          if (colIdx === undefined) continue; // header not found in this file — skip, already reported above
          const value = col.get({ product, size });
          writes.push({ r: rowIndex, c: colIdx, v: value, label: `${product.sku}-${size.size}: ${col.header}` });
        }
        rowIndex += 1;
      }
    }

    const warnings: string[] = [];
    const capped = products.filter((p) => platformPrice(p, 'flipkart').capped);
    if (capped.length > 0) {
      warnings.push(
        `Price capped at MRP (site price ${markupLabel('flipkart')} would exceed it): ` +
          capped.map((p) => `${p.sku} → ₹${platformPrice(p, 'flipkart').price}`).join(', ')
      );
    }
    if (unmatchedHeaders.length > 0) {
      warnings.push(`Columns not found in uploaded file (left blank): ${unmatchedHeaders.join(', ')}`);
    }

    let buffer: Buffer;
    if (await isExcelAvailable()) {
      // Preferred: real Excel edits Flipkart's file in place, keeping its
      // embedded macros intact (SheetJS strips them -> "File is not Valid").
      buffer = await fillWithExcel(
        Buffer.from(arrayBuffer),
        file.name,
        sheetName,
        writes.filter((w) => w.v !== '').map(({ r, c, v }) => ({ r, c, v }))
      );
    } else {
      const truncatedFields: string[] = [];
      for (const w of writes) {
        let value = w.v;
        if (typeof value === 'string' && value) {
          const result = safeTruncate(value);
          value = result.value;
          if (result.truncated) truncatedFields.push(w.label);
        }
        sheet[XLSX.utils.encode_cell({ r: w.r, c: w.c })] = { t: typeof value === 'number' ? 'n' : 's', v: value };
      }
      // Extend the sheet range to cover the rows we just wrote.
      const newRange = { s: range.s, e: { r: Math.max(range.e.r, rowIndex - 1), c: range.e.c } };
      sheet['!ref'] = XLSX.utils.encode_range(newRange);
      buffer = XLSX.write(workbook, { bookType: 'xls', type: 'buffer' });

      warnings.push('Excel not available on this machine — file was rebuilt without Flipkart\'s embedded macros, so Flipkart may reject it as "File is not Valid". Use Fill Flipkart Template from the local admin panel on the Windows laptop instead.');
      if (truncatedFields.length > 0) {
        warnings.push(`Text shortened to fit Excel's 255-character limit: ${truncatedFields.join('; ')}`);
      }
    }

    // Remember which Flipkart request these products went into (the "REQ..."
    // id in Flipkart's template filename) so the admin table can show them as
    // "QC in progress" until the Seller API reports them live.
    const requestId = file.name.match(/FK_(REQ[A-Z0-9]+)/)?.[1];
    if (requestId) {
      await prisma.flipkartListingDetail.updateMany({
        where: { productId: { in: products.map((p) => p.id) } },
        data: { flipkartRequestId: requestId, flipkartSubmittedAt: new Date() },
      });
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'X-Fill-Warnings': encodeURIComponent(warnings.join(' || ')),
      },
    });
  } catch (error) {
    console.error('Flipkart fill-template error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Fill-template failed' }, { status: 500 });
  }
}
