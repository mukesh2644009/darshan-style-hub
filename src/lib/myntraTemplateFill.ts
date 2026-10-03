import ExcelJS from 'exceljs';
import { getMyntraColumns, type ProductWithMyntra, type MyntraSheetName } from './myntra';

// Fills Myntra's own downloaded bulk template ("Myntra-Sku-Template-….xlsx",
// one article-type sheet + __INSTRUCTIONS + masterdata) in place, matching
// our column definitions to the template's header row BY NAME — so if Myntra
// reorders or adds columns in a new template version, we still land in the
// right cells. Myntra's dropdowns/formatting stay as Myntra made them.

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];

function sortSizes(sizes: ProductWithMyntra['sizes']) {
  return [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.size);
    const bi = SIZE_ORDER.indexOf(b.size);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export interface MyntraFillResult {
  buffer: Buffer;
  unmatchedHeaders: string[]; // our columns the template doesn't have (left out)
  rowsWritten: number;
}

export async function fillMyntraTemplate(
  template: Buffer,
  sheetName: MyntraSheetName,
  products: ProductWithMyntra[]
): Promise<MyntraFillResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(template as unknown as ArrayBuffer);
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    const names = workbook.worksheets.map((w) => w.name).filter((n) => !n.startsWith('__') && n !== 'masterdata');
    throw new Error(`This template is for "${names.join(', ')}", not "${sheetName}". Download the ${sheetName} template from Myntra.`);
  }

  // Header row = the one containing "vendorSkuCode" (row 3 in template v13).
  let headerRowNum = 0;
  for (let r = 1; r <= 15 && !headerRowNum; r++) {
    sheet.getRow(r).eachCell((cell) => { if (String(cell.value).trim() === 'vendorSkuCode') headerRowNum = r; });
  }
  if (!headerRowNum) throw new Error('Could not find the header row (vendorSkuCode) in this template.');

  const headerToCol = new Map<string, number>();
  sheet.getRow(headerRowNum).eachCell((cell, col) => {
    const h = String(cell.value ?? '').trim();
    if (h) headerToCol.set(h, col);
  });

  const columns = getMyntraColumns(sheetName);
  const unmatchedHeaders = columns.filter((c) => !headerToCol.has(c.header)).map((c) => c.header);

  // Start below any rows already filled in. Myntra pre-formats empty rows
  // (dropdowns/styles), so check for real values, not just styled cells.
  const hasValues = (r: number) => {
    let found = false;
    sheet.getRow(r).eachCell((cell) => { if (cell.value !== null && String(cell.value).trim() !== '') found = true; });
    return found;
  };
  let rowNum = headerRowNum + 1;
  while (hasValues(rowNum)) rowNum++;

  let rowsWritten = 0;
  products.forEach((product, productIndex) => {
    const styleGroupId = productIndex + 1;
    for (const size of sortSizes(product.sizes)) {
      const row = sheet.getRow(rowNum);
      for (const col of columns) {
        const c = headerToCol.get(col.header);
        if (!c) continue;
        const v = col.get({ product, size, styleGroupId });
        if (v !== '' && v != null) row.getCell(c).value = v;
      }
      row.commit();
      rowNum++;
      rowsWritten++;
    }
  });

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return { buffer, unmatchedHeaders, rowsWritten };
}
