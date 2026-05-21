import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { convertHtmlToPdf } from '../htmlToPdfService';

describe('htmlToPdfService', () => {
  it('renders structured HTML into a PDF', async () => {
    const html = '<html><body><h1>Invoice</h1><p>Total due today</p><ul><li>Hosting</li></ul></body></html>';
    const output = await convertHtmlToPdf(new TextEncoder().encode(html).buffer);
    const pdf = await PDFDocument.load(output);

    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getPage(0).getSize()).toEqual({ width: 595.28, height: 841.89 });
  });

  it('rejects empty HTML input', async () => {
    await expect(convertHtmlToPdf(new ArrayBuffer(0))).rejects.toThrow('empty HTML');
  });
});
