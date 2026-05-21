import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { convertPdfToPdfA } from '../pdfAService';

describe('pdfAService', () => {
  it('injects PDF/A identifiers and output intent metadata', async () => {
    const source = await PDFDocument.create();
    source.addPage([200, 200]);

    const sourceBytes = await source.save();
    const output = await convertPdfToPdfA(toExactArrayBuffer(sourceBytes));
    const text = new TextDecoder().decode(output);

    expect(text).toContain('<pdfaid:part>1</pdfaid:part>');
    expect(text).toContain('<pdfaid:conformance>B</pdfaid:conformance>');
    expect(text).toContain('/GTS_PDFA1');
    expect(text).toContain('sRGB IEC61966-2.1');
  });

  it('rejects empty PDF input', async () => {
    await expect(convertPdfToPdfA(new ArrayBuffer(0))).rejects.toThrow('empty PDF');
  });
});

function toExactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}
