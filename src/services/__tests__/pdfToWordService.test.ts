import { beforeEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import { convertPdfToWord } from '../pdfToWordService';

const getPage = vi.fn();

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  VerbosityLevel: { ERRORS: 0 },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      destroy: vi.fn(async () => undefined),
      getPage,
    }),
  })),
}));

describe('pdfToWordService', () => {
  beforeEach(() => {
    getPage.mockResolvedValue({
      getTextContent: vi.fn(async () => ({
        items: [
          { str: 'Hello', transform: [11, 0, 0, 11, 36, 740] },
          { str: 'world', transform: [11, 0, 0, 11, 72, 740] },
          { str: 'Second line', transform: [10, 0, 0, 10, 36, 710] },
        ],
      })),
      cleanup: vi.fn(),
    });
  });

  it('builds an editable DOCX from PDF text lines', async () => {
    const output = await convertPdfToWord(new Uint8Array([37, 80, 68, 70]).buffer);
    const zip = await JSZip.loadAsync(output);
    const documentXml = await zip.file('word/document.xml')?.async('text');

    expect(documentXml).toContain('Hello');
    expect(documentXml).toContain('world');
    expect(documentXml).toContain('Second line');
  });

  it('rejects empty PDF input', async () => {
    await expect(convertPdfToWord(new ArrayBuffer(0))).rejects.toThrow('empty PDF');
  });
});
