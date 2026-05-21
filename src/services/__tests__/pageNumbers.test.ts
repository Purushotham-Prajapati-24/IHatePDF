import { describe, it, expect } from 'vitest';
import { addPageNumbersToPdfBuffer } from '../pdfOperations';
import { PDFDocument } from 'pdf-lib';

describe('addPageNumbersToPdfBuffer', () => {
  it('should add page numbers to a PDF', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 800]);
    pdfDoc.addPage([600, 800]);
    const pdfBytes = await pdfDoc.save();
    
    const options = {
      position: 'bottom-right' as const,
      format: 'Page {n} of {total}',
      font: 'helvetica' as const,
      color: '#000000',
      size: 12,
      margin: 36,
    };
    
    const sourceBuffer = new ArrayBuffer(pdfBytes.byteLength);
    new Uint8Array(sourceBuffer).set(pdfBytes);
    const resultBuffer = await addPageNumbersToPdfBuffer(sourceBuffer, options);
    expect(resultBuffer.byteLength).toBeGreaterThan(pdfBytes.byteLength);
    
    const resultPdf = await PDFDocument.load(resultBuffer);
    expect(resultPdf.getPageCount()).toBe(2);
  });
});
