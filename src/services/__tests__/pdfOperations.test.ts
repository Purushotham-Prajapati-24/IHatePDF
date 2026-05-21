import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFName } from 'pdf-lib';
import {
  addPageNumbersToPdfBuffer,
  addWatermarkToPdfBuffer,
  cropPdfBuffer,
  editPdfBuffer,
  fillPdfFormBuffer,
  imagesToPdfBuffer,
  mergePdfBuffers,
  organizePdfBuffer,
  repairPdfBuffer,
  rotatePdfBuffer,
  splitPdfBuffer,
} from '../pdfOperations';

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

  it('repairs a PDF with missing EOF trailer data', async () => {
    const sourcePdf = await createPdfWithPages(2);
    const truncatedPdf = truncateAfterLastObject(sourcePdf);

    const repairedBuffer = await repairPdfBuffer(truncatedPdf);
    const repairedText = new TextDecoder('latin1').decode(repairedBuffer);
    const repairedPdf = await PDFDocument.load(repairedBuffer);

    expect(repairedText).toContain('%%EOF');
    expect(repairedPdf.getPageCount()).toBe(2);
  });

  it('adds formatted page numbers while preserving page count', async () => {
    const sourcePdf = await createPdfWithPages(5);

    const numberedPdf = await PDFDocument.load(await addPageNumbersToPdfBuffer(sourcePdf, {
      position: 'bottom-right',
      format: 'Page {n} of {total}',
      font: 'helvetica',
      color: '#111111',
      size: 12,
      margin: 24,
    }));

    expect(numberedPdf.getPageCount()).toBe(5);
    expect(numberedPdf.getPages().every((page) => page.node.get(PDFName.of('Contents')) !== undefined)).toBe(true);
  });

  it('rejects invalid page number styling options', async () => {
    const sourcePdf = await createPdfWithPages(1);

    await expect(addPageNumbersToPdfBuffer(sourcePdf, {
      position: 'bottom-right',
      format: '{n}',
      font: 'helvetica',
      color: '#111111',
      size: 3,
      margin: 24,
    })).rejects.toThrow('size');
  });

  it('adds a rotated translucent text watermark to every page', async () => {
    const sourcePdf = await createPdfWithPages(3);

    const watermarkedPdf = await PDFDocument.load(await addWatermarkToPdfBuffer(sourcePdf, {
      text: 'CONFIDENTIAL',
      opacity: 0.3,
      rotation: 45,
      font: 'helvetica',
      color: '#111111',
      size: 36,
    }));

    expect(watermarkedPdf.getPageCount()).toBe(3);
    expect(watermarkedPdf.getPages().every((page) => page.node.get(PDFName.of('Contents')) !== undefined)).toBe(true);
  });

  it('rejects invalid watermark opacity', async () => {
    const sourcePdf = await createPdfWithPages(1);

    await expect(addWatermarkToPdfBuffer(sourcePdf, {
      text: 'CONFIDENTIAL',
      opacity: 1.5,
      rotation: 45,
      font: 'helvetica',
      color: '#111111',
      size: 36,
    })).rejects.toThrow('opacity');
  });

  it('crops every page to the requested box', async () => {
    const sourcePdf = await createPdfWithPages(2);

    const croppedPdf = await PDFDocument.load(await cropPdfBuffer(sourcePdf, {
      x: 20,
      y: 30,
      width: 180,
      height: 160,
    }));

    expect(croppedPdf.getPages().map((page) => page.getSize())).toEqual([
      { width: 180, height: 160 },
      { width: 180, height: 160 },
    ]);
  });

  it('rejects crop bounds outside the page', async () => {
    const sourcePdf = await createPdfWithPages(1);

    await expect(cropPdfBuffer(sourcePdf, {
      x: 250,
      y: 0,
      width: 100,
      height: 100,
    })).rejects.toThrow('exceed');
  });

  it('draws text, rectangle, and ink annotations onto PDF pages', async () => {
    const sourcePdf = await createPdfWithPages(2);

    const editedPdf = await PDFDocument.load(await editPdfBuffer(sourcePdf, [
      { type: 'text', pageIndex: 0, viewportWidth: 300, viewportHeight: 300, x: 20, y: 30, text: 'CONFIDENTIAL', size: 18, color: '#111111' },
      { type: 'rectangle', pageIndex: 0, viewportWidth: 300, viewportHeight: 300, x: 40, y: 60, width: 100, height: 80, color: '#cc1234', borderWidth: 3 },
      { type: 'ink', pageIndex: 1, viewportWidth: 300, viewportHeight: 300, points: [{ x: 20, y: 20 }, { x: 80, y: 100 }, { x: 140, y: 40 }], width: 4, color: '#111111' },
    ]));

    expect(editedPdf.getPageCount()).toBe(2);
    expect(editedPdf.getPages().every((page) => page.node.get(PDFName.of('Contents')) !== undefined)).toBe(true);
  });

  it('rejects edit annotations with invalid page indexes', async () => {
    const sourcePdf = await createPdfWithPages(1);

    await expect(editPdfBuffer(sourcePdf, [
      { type: 'text', pageIndex: 3, viewportWidth: 300, viewportHeight: 300, x: 20, y: 30, text: 'Nope', size: 12, color: '#111111' },
    ])).rejects.toThrow('page index');
  });

  it('fills and flattens PDF form fields', async () => {
    const sourcePdf = await createPdfForm();

    const filledPdf = await PDFDocument.load(await fillPdfFormBuffer(sourcePdf, {
      fields: [
        { name: 'name', value: 'Ada Lovelace' },
        { name: 'accepted', value: true },
        { name: 'tier', value: 'Pro' },
      ],
      flatten: true,
    }));

    expect(filledPdf.getForm().getFields()).toHaveLength(0);
  });

  it('rejects missing PDF form fields', async () => {
    const sourcePdf = await createPdfForm();

    await expect(fillPdfFormBuffer(sourcePdf, {
      fields: [{ name: 'missing', value: 'Nope' }],
      flatten: false,
    })).rejects.toThrow('not found');
  });

  it('converts multiple images into matching PDF pages', async () => {
    const image = createPngBuffer();

    const pdf = await PDFDocument.load(await imagesToPdfBuffer([
      { fileName: 'one.png', mimeType: 'image/png', data: image },
      { fileName: 'two.png', mimeType: 'image/png', data: image.slice(0) },
      { fileName: 'three.png', mimeType: 'image/png', data: image.slice(0) },
    ], { pageSize: 'a4', orientation: 'portrait', margin: 24 }));

    expect(pdf.getPageCount()).toBe(3);
    expect(pdf.getPage(0).getSize()).toEqual({ width: 595.28, height: 841.89 });
  });

  it('rejects empty image conversion inputs', async () => {
    await expect(imagesToPdfBuffer([], { pageSize: 'image', orientation: 'portrait', margin: 0 })).rejects.toThrow('at least one');
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

async function createPdfForm(): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([300, 300]);
  const form = pdf.getForm();
  const name = form.createTextField('name');
  const accepted = form.createCheckBox('accepted');
  const tier = form.createDropdown('tier');

  name.addToPage(page, { x: 20, y: 240, width: 180, height: 24 });
  accepted.addToPage(page, { x: 20, y: 200, width: 16, height: 16 });
  tier.setOptions(['Free', 'Pro']);
  tier.addToPage(page, { x: 20, y: 160, width: 120, height: 24 });

  const bytes = await pdf.save();
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}

function truncateAfterLastObject(file: ArrayBuffer): ArrayBuffer {
  const text = new TextDecoder('latin1').decode(file);
  const endObjectIndex = text.lastIndexOf('endobj');

  if (endObjectIndex === -1) {
    throw new Error('Fixture PDF did not contain objects.');
  }

  return file.slice(0, endObjectIndex + 'endobj'.length);
}

function createPngBuffer(): ArrayBuffer {
  const bytes = Uint8Array.from(
    atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='),
    (char) => char.charCodeAt(0),
  );

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
