import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { mergePdfBuffers, organizePdfBuffer, rotatePdfBuffer, splitPdfBuffer } from '../pdfOperations';

describe('pdfOperations', () => {
  it('merges PDFs while preserving every page', async () => {
    const onePagePdf = await createPdfWithPages(1);
    const threePagePdf = await createPdfWithPages(3);

    const mergedPdf = await PDFDocument.load(await mergePdfBuffers([onePagePdf, threePagePdf]));

    expect(mergedPdf.getPageCount()).toBe(4);
  });

  it('splits a PDF into requested page ranges', async () => {
    const sourcePdf = await createPdfWithPages(3);

    const [firstPage, remainingPages] = await splitPdfBuffer(sourcePdf, [
      { start: 1, end: 1 },
      { start: 2, end: 3 },
    ]);

    expect((await PDFDocument.load(firstPage)).getPageCount()).toBe(1);
    expect((await PDFDocument.load(remainingPages)).getPageCount()).toBe(2);
  });

  it('rotates PDF pages by their matching rotation values', async () => {
    const sourcePdf = await createPdfWithPages(3);

    const rotatedPdf = await PDFDocument.load(await rotatePdfBuffer(sourcePdf, [90, 180, 270]));
    const rotationAngles = rotatedPdf.getPages().map((page) => page.getRotation().angle);

    expect(rotationAngles).toEqual([90, 180, 270]);
  });

  it('organizes PDF pages by requested order and rotation', async () => {
    const sourcePdf = await createPdfWithPages(3);

    const organizedPdf = await PDFDocument.load(await organizePdfBuffer(sourcePdf, [
      { pageIndex: 2, rotation: 180 },
      { pageIndex: 0, rotation: 90 },
    ]));

    expect(organizedPdf.getPageCount()).toBe(2);
    expect(organizedPdf.getPages().map((page) => page.getRotation().angle)).toEqual([180, 90]);
  });
});

async function createPdfWithPages(pageCount: number): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();

  for (let index = 0; index < pageCount; index += 1) {
    pdf.addPage([300, 300]);
  }

  const bytes = await pdf.save();
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}
