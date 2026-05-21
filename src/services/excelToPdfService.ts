import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { ExcelToPdfOptions } from './pdfOperations';

const PORTRAIT = { width: 595.28, height: 841.89 };
const LANDSCAPE = { width: 841.89, height: 595.28 };
const PAGE_MARGIN = 36;
const ROW_HEIGHT = 22;
const FONT_SIZE = 9;

interface SheetCell {
  row: number;
  column: number;
  value: string;
}

interface SheetData {
  name: string;
  cells: SheetCell[];
  rowCount: number;
  columnCount: number;
}

interface WorkbookSheet {
  id: string;
  name: string;
  path: string;
}

export async function getExcelSheets(file: ArrayBuffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(file);
  const sheets = await readWorkbookSheets(zip);
  return sheets.map((s) => s.name);
}

export async function convertExcelToPdf(file: ArrayBuffer, options?: ExcelToPdfOptions): Promise<ArrayBuffer> {
  assertExcelInput(file);
  const zip = await JSZip.loadAsync(file);
  const allSheets = await readWorkbookSheets(zip);
  
  const selectedSheetNames = options?.selectedSheets?.length 
    ? options.selectedSheets 
    : [allSheets[0].name];

  const sharedStrings = await readSharedStrings(zip);
  const sheetsToProcess: SheetData[] = [];

  for (const sheetInfo of allSheets) {
    if (selectedSheetNames.includes(sheetInfo.name)) {
      const worksheetXml = await readZipText(zip, sheetInfo.path);
      const cells = parseWorksheetCells(worksheetXml, sharedStrings);
      
      if (cells.length > 0) {
        sheetsToProcess.push({
          name: sheetInfo.name,
          cells,
          rowCount: Math.max(...cells.map((cell) => cell.row), 0),
          columnCount: Math.max(...cells.map((cell) => cell.column), 0),
        });
      }
    }
  }

  if (sheetsToProcess.length === 0) {
    throw new Error('No readable Excel cells were found in the selected sheets.');
  }

  return renderSheetsToPdf(sheetsToProcess, options);
}

function assertExcelInput(file: ArrayBuffer): void {
  if (file.byteLength === 0) {
    throw new Error('Cannot convert an empty Excel workbook.');
  }
}

async function readWorkbookSheets(zip: JSZip): Promise<WorkbookSheet[]> {
  const workbookXml = await readZipText(zip, 'xl/workbook.xml');
  const sheetMatches = Array.from(workbookXml.matchAll(/<sheet\b[^>]*name="([^"]+)"[^>]*sheetId="([^"]+)"[^>]*r:id="([^"]+)"/g));
  
  const relsXml = await readZipText(zip, 'xl/_rels/workbook.xml.rels');
  const rels = Array.from(relsXml.matchAll(/Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g))
    .reduce((acc, match) => ({ ...acc, [match[1]]: match[2] }), {} as Record<string, string>);

  return sheetMatches.map((match) => ({
    name: decodeXml(match[1]),
    id: match[2],
    path: `xl/${rels[match[3]]}`,
  }));
}

async function readSharedStrings(zip: JSZip): Promise<string[]> {
  const file = zip.file('xl/sharedStrings.xml');
  if (!file) return [];

  const xml = await file.async('text');
  return Array.from(xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g))
    .map((match) => Array.from(match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)).map((text) => decodeXml(text[1])).join(''));
}

function parseWorksheetCells(xml: string, sharedStrings: string[]): SheetCell[] {
  return Array.from(xml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g))
    .map((match) => parseCell(match[1], match[2], sharedStrings))
    .filter((cell): cell is SheetCell => cell !== null);
}

function parseCell(attributes: string, body: string, sharedStrings: string[]): SheetCell | null {
  const reference = attributes.match(/\br="([A-Z]+\d+)"/i)?.[1];
  const rawValue = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? body.match(/<t\b[^>]*>([\s\S]*?)<\/t>/)?.[1];

  if (!reference || rawValue === undefined) {
    return null;
  }

  const position = parseCellReference(reference);
  const isSharedString = /\bt="s"/.test(attributes);
  const value = isSharedString ? sharedStrings[Number(rawValue)] ?? '' : decodeXml(rawValue);

  return value.length > 0 ? { ...position, value } : null;
}

function parseCellReference(reference: string): Pick<SheetCell, 'row' | 'column'> {
  const match = reference.match(/^([A-Z]+)(\d+)$/i);
  if (!match) throw new Error(`Invalid Excel cell reference: ${reference}.`);

  return { column: columnNameToNumber(match[1]), row: Number(match[2]) };
}

async function renderSheetsToPdf(sheets: SheetData[], options?: ExcelToPdfOptions): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  
  const isLandscape = options?.orientation === 'landscape';
  const customPageSize = options?.pageSize === 'a4' 
    ? (isLandscape ? LANDSCAPE : PORTRAIT)
    : null;

  for (const sheet of sheets) {
    const pageSize = customPageSize || (sheet.columnCount > 10 ? LANDSCAPE : PORTRAIT);
    const columnWidth = (pageSize.width - PAGE_MARGIN * 2) / Math.max(sheet.columnCount, 1);
    let page = addSheetPage(pdf, sheet.name, pageSize, boldFont);
    let y = pageSize.height - PAGE_MARGIN - 42;

    for (let row = 1; row <= sheet.rowCount; row += 1) {
      if (y < PAGE_MARGIN + ROW_HEIGHT) {
        page = addSheetPage(pdf, sheet.name, pageSize, boldFont);
        y = pageSize.height - PAGE_MARGIN - 42;
      }
      drawRow(page, sheet, row, y, columnWidth, font, boldFont);
      y -= ROW_HEIGHT;
    }
  }

  return toExactArrayBuffer(await pdf.save());
}

function addSheetPage(
  pdf: PDFDocument,
  sheetName: string,
  pageSize: typeof PORTRAIT,
  font: PDFFont,
): PDFPage {
  const page = pdf.addPage([pageSize.width, pageSize.height]);
  page.drawText(sheetName, { x: PAGE_MARGIN, y: pageSize.height - PAGE_MARGIN, size: 16, font, color: rgb(0.07, 0.07, 0.07) });
  return page;
}

function drawRow(page: PDFPage, sheet: SheetData, row: number, y: number, columnWidth: number, font: PDFFont, boldFont: PDFFont): void {
  for (let column = 1; column <= sheet.columnCount; column += 1) {
    const x = PAGE_MARGIN + (column - 1) * columnWidth;
    const cell = sheet.cells.find((entry) => entry.row === row && entry.column === column);
    drawCell(page, x, y, columnWidth, cell?.value ?? '', row === 1 ? boldFont : font);
  }
}

function drawCell(page: PDFPage, x: number, y: number, width: number, value: string, font: PDFFont): void {
  page.drawRectangle({
    x,
    y: y - ROW_HEIGHT + 4,
    width,
    height: ROW_HEIGHT,
    borderColor: rgb(0.72, 0.72, 0.72),
    borderWidth: 0.5,
  });
  page.drawText(truncateText(value, font, width - 8), {
    x: x + 4,
    y: y - 12,
    size: FONT_SIZE,
    font,
    color: rgb(0.08, 0.08, 0.08),
  });
}

function truncateText(value: string, font: PDFFont, maxWidth: number): string {
  const cleanValue = value.replace(/\s+/g, ' ').trim();
  if (font.widthOfTextAtSize(cleanValue, FONT_SIZE) <= maxWidth) return cleanValue;

  let output = cleanValue;
  while (output.length > 1 && font.widthOfTextAtSize(`${output}...`, FONT_SIZE) > maxWidth) {
    output = output.slice(0, -1);
  }
  return `${output}...`;
}

function findFirstWorksheetPath(zip: JSZip): string {
  const path = Object.keys(zip.files).find((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name));
  if (!path) throw new Error('No Excel worksheet XML was found.');
  return path;
}

async function readZipText(zip: JSZip, path: string): Promise<string> {
  const file = zip.file(path);
  if (!file) throw new Error(`Excel workbook part is missing: ${path}.`);
  return file.async('text');
}

function columnNameToNumber(name: string): number {
  return name.toUpperCase().split('').reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0);
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function toExactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}
