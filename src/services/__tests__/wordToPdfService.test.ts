import { describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { convertWordToPdf } from '../wordToPdfService';

vi.mock('mammoth', () => ({
  convertToHtml: vi.fn(async () => ({
    value: '<h1>Resume</h1><p>Senior engineer with browser PDF experience.</p><ul><li>Built local conversion tools</li><li>Maintained document privacy</li></ul>',
    messages: [],
  })),
}));

describe('wordToPdfService', () => {
  it('renders Mammoth HTML into a readable PDF', async () => {
    const output = await convertWordToPdf(new Uint8Array([80, 75, 3, 4]).buffer);
    const pdf = await PDFDocument.load(output);

    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getPage(0).getSize()).toEqual({ width: 595.28, height: 841.89 });
  });

  it('rejects empty DOCX input', async () => {
    await expect(convertWordToPdf(new ArrayBuffer(0))).rejects.toThrow('empty Word document');
  });
});
