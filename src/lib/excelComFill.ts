import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

// Fills cells in a real Flipkart template by driving the locally installed
// Microsoft Excel (COM automation), instead of re-serialising the workbook
// with SheetJS. Flipkart's templates embed VBA macros that SheetJS's .xls
// writer silently drops (1.58MB -> 197KB), and Flipkart rejects the result
// with "File is not Valid" (confirmed 2026-09-30). Excel edits the file in
// place, so macros, validations and hidden sheets survive untouched — and
// there's no 255-char cell limit either.
//
// Only works on a Windows machine with Excel installed (i.e. the admin's
// laptop running the dev server). Callers must fall back when it's missing.

export type CellWrite = { r: number; c: number; v: string | number };

const PS_SCRIPT = `
param([string]$Path, [string]$Sheet, [string]$WritesJson)
$ErrorActionPreference = 'Stop'
$writes = Get-Content -Raw -Encoding UTF8 $WritesJson | ConvertFrom-Json
$excel = New-Object -ComObject Excel.Application
$wb = $null
try {
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  $excel.AutomationSecurity = 3  # msoAutomationSecurityForceDisable: open without running macros
  $wb = $excel.Workbooks.Open($Path)
  $ws = $wb.Worksheets.Item($Sheet)
  foreach ($w in $writes) {
    $cell = $ws.Range([string]$w.a)
    if ($w.v -is [string]) { $cell.Value2 = [string]$w.v } else { $cell.Value2 = [double]$w.v }
  }
  $wb.Save()
} finally {
  if ($wb) { $wb.Close($false) | Out-Null }
  $excel.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
`;

// 0-based column index -> Excel letters (0 -> A, 26 -> AA).
function columnLetter(c: number): string {
  let s = '';
  for (let n = c + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  }
  return s;
}

function run(cmd: string, args: string[], timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: timeoutMs, windowsHide: true }, (error, _stdout, stderr) => {
      if (error) reject(new Error(stderr?.trim() || error.message));
      else resolve();
    });
  });
}

export async function isExcelAvailable(): Promise<boolean> {
  if (process.platform !== 'win32') return false;
  try {
    await run('reg', ['query', 'HKCR\\Excel.Application\\CurVer'], 10_000);
    return true;
  } catch {
    return false;
  }
}

export async function fillWithExcel(
  original: Buffer,
  fileName: string,
  sheetName: string,
  writes: CellWrite[]
): Promise<Buffer> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fk-fill-'));
  try {
    const filePath = path.join(dir, path.basename(fileName));
    const writesPath = path.join(dir, 'writes.json');
    const scriptPath = path.join(dir, 'fill.ps1');
    await fs.writeFile(filePath, original);
    const addressed = writes.map((w) => ({ a: `${columnLetter(w.c)}${w.r + 1}`, v: w.v }));
    await fs.writeFile(writesPath, JSON.stringify(addressed), 'utf8');
    // BOM so Windows PowerShell 5.1 reads the script as UTF-8.
    await fs.writeFile(scriptPath, '﻿' + PS_SCRIPT, 'utf8');
    await run(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath,
        '-Path', filePath, '-Sheet', sheetName, '-WritesJson', writesPath],
      120_000
    );
    return await fs.readFile(filePath);
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
