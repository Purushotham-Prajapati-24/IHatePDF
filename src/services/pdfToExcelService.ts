import JSZip from 'jszip';
import { GlobalWorkerOptions, VerbosityLevel, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

const PDFJS_WORKER_SRC = '/assets/pdf.worker.min.mjs';
const ROW_Y_TOLERANCE = 5;
const COLUMN_X_TOLERANCE = 18;

GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;

interface PdfTextItem extends TextItem {
  transform: number[];
}

interface PositionedText {
  text: string;
  x: number;
  y: number;
}

interface SheetRow {
  y: number;
  cells: PositionedText[];
}

export async function convertPdfToExcel(file: ArrayBuffer): Promise<ArrayBuffer> {
  assertPdfInput(file);
  const pdf = await loadPdf(file);

  try {
    const rows = await extractRows(pdf);
    if (rows.length === 0) {
      throw new Error('No readable table text was found in this PDF.');
    }

    return createWorkbook(rowsToGrid(rows));
  } finally {
    await pdf.destroy();
  }
}

function assertPdfInput(file: ArrayBuffer): void {
  if (file.byteLength === 0) {
    throw new Error('Cannot convert an empty PDF to Excel.');
  }
}

async function loadPdf(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  try {
    return await getDocument({ data, verbosity: VerbosityLevel.ERRORS }).promise;
  } catch (error) {
    throw new Error(error instanceof Error ? `Unable to read PDF for Excel conversion: ${error.message}` : 'Unable to read PDF for Excel conversion.');
  }
}

async function extractRows(pdf: PDFDocumentProxy): Promise<SheetRow[]> {
  const rows: SheetRow[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const texts = content.items
      .filter((item): item is PdfTextItem => isPdfTextItem(item))
      .map(toPositionedText)
      .filter((item) => item.text.length > 0);

    rows.push(...groupRows(texts));
    page.cleanup();
  }

  return rows;
}

function isPdfTextItem(item: unknown): item is PdfTextItem {
  if (typeof item !== 'object' || item === null) return false;

  const candidate = item as Partial<PdfTextItem>;
  return typeof candidate.str === 'string'
    && Array.isArray(candidate.transform)
    && candidate.transform.length >= 6;
}

function toPositionedText(item: PdfTextItem): PositionedText {
  return {
    text: item.str.replace(/\s+/g, ' ').trim(),
    x: item.transform[4],
    y: item.transform[5],
  };
}

function groupRows(texts: PositionedText[]): SheetRow[] {
  const rows: SheetRow[] = [];

  texts.sort((a, b) => b.y - a.y || a.x - b.x).forEach((text) => {
    const row = rows.find((entry) => Math.abs(entry.y - text.y) <= ROW_Y_TOLERANCE);
    if (row) {
      row.cells.push(text);
      return;
    }
    rows.push({ y: text.y, cells: [text] });
  });

  return rows.map((row) => ({ y: row.y, cells: row.cells.sort((a, b) => a.x - b.x) }));
}

function rowsToGrid(rows: SheetRow[]): string[][] {
  const columns = detectColumns(rows.flatMap((row) => row.cells));

  return rows.map((row) => {
    const values = Array.from({ length: columns.length }, () => '');
    row.cells.forEach((cell) => {
      const columnIndex = findNearestColumn(columns, cell.x);
      values[columnIndex] = values[columnIndex] ? `${values[columnIndex]} ${cell.text}` : cell.text;
    });
    return trimTrailingEmptyCells(values);
  });
}

function detectColumns(cells: PositionedText[]): number[] {
  const columns: number[] = [];

  cells.map((cell) => cell.x).sort((a, b) => a - b).forEach((x) => {
    if (!columns.some((column) => Math.abs(column - x) <= COLUMN_X_TOLERANCE)) {
      columns.push(x);
    }
  });

  return columns.length > 0 ? columns : [0];
}

function findNearestColumn(columns: number[], x: number): number {
  return columns.reduce((best, column, index) => (
    Math.abs(column - x) < Math.abs(columns[best] - x) ? index : best
  ), 0);
}

function trimTrailingEmptyCells(values: string[]): string[] {
  let end = values.length;
  while (end > 0 && values[end - 1] === '') end -= 1;
  return values.slice(0, end);
}

async function createWorkbook(rows: string[][]): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', createContentTypesXml());
  zip.file('_rels/.rels', createRootRelsXml());
  zip.file('xl/workbook.xml', createWorkbookXml());
  zip.file('xl/_rels/workbook.xml.rels', createWorkbookRelsXml());
  zip.file('xl/worksheets/sheet1.xml', createWorksheetXml(rows));
  return zip.generateAsync({ type: 'arraybuffer' });
}

function createWorksheetXml(rows: string[][]): string {
  const rowXml = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => createCellXml(rowIndex + 1, columnIndex + 1, value)).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowXml}</sheetData></worksheet>`;
}

function createCellXml(row: number, column: number, value: string): string {
  return `<c r="${columnNumberToName(column)}${row}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
}

function columnNumberToName(column: number): string {
  let current = column;
  let name = '';
  while (current > 0) {
    current -= 1;
    name = String.fromCharCode(65 + (current % 26)) + name;
    current = Math.floor(current / 26);
  }
  return name;
}

function createContentTypesXml(): string {
  return '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>';
}

function createRootRelsXml(): string {
  return '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
}

function createWorkbookXml(): string {
  return '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Extracted Table" sheetId="1" r:id="rId1"/></sheets></workbook>';
}

function createWorkbookRelsXml(): string {
  return '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>';
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
