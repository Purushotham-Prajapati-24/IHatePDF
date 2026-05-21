import { degrees, PDFDocument } from 'pdf-lib';
import type { SplitRange } from './pdfService';

export async function mergePdfBuffers(files: ArrayBuffer[]): Promise<ArrayBuffer> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const sourcePdf = await PDFDocument.load(file);
    const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return toExactArrayBuffer(await mergedPdf.save());
}

export async function splitPdfBuffer(file: ArrayBuffer, ranges: SplitRange[]): Promise<ArrayBuffer[]> {
  const sourcePdf = await PDFDocument.load(file);

  return Promise.all(
    ranges.map(async (range) => {
      const splitPdf = await PDFDocument.create();
      const pageIndexes = createPageIndexes(range.start, range.end);
      const copiedPages = await splitPdf.copyPages(sourcePdf, pageIndexes);
      copiedPages.forEach((page) => splitPdf.addPage(page));
      return toExactArrayBuffer(await splitPdf.save());
    }),
  );
}

export async function rotatePdfBuffer(file: ArrayBuffer, rotations: number[]): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.load(file);

  pdf.getPages().forEach((page, index) => {
    page.setRotation(degrees(normalizeRotation(rotations[index] ?? 0)));
  });

  return toExactArrayBuffer(await pdf.save());
}

export interface OrganizePageRequest {
  pageIndex: number;
  rotation: number;
}

export async function organizePdfBuffer(file: ArrayBuffer, pages: OrganizePageRequest[]): Promise<ArrayBuffer> {
  const sourcePdf = await PDFDocument.load(file);
  const organizedPdf = await PDFDocument.create();

  if (pages.length === 0) {
    throw new Error('Select at least one page to organize.');
  }

  for (const pageRequest of pages) {
    const copiedPages = await organizedPdf.copyPages(sourcePdf, [pageRequest.pageIndex]);
    const [copiedPage] = copiedPages;
    copiedPage.setRotation(degrees(normalizeRotation(pageRequest.rotation)));
    organizedPdf.addPage(copiedPage);
  }

  return toExactArrayBuffer(await organizedPdf.save());
}

function createPageIndexes(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start - 1 + index);
}

function normalizeRotation(rotation: number): number {
  return ((rotation % 360) + 360) % 360;
}

function toExactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}
