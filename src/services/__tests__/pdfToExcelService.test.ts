import { beforeEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import { convertPdfToExcel } from '../pdfToExcelService';

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

describe('pdfToExcelService', () => {
  beforeEach(() => {
    getPage.mockResolvedValue({
      getTextContent: vi.fn(async () => ({
        items: [
          { str: 'Item', transform: [10, 0, 0, 10, 50, 700] },
          { str: 'Total', transform: [10, 0, 0, 10, 220, 700] },
          { str: 'Hosting', transform: [10, 0, 0, 10, 50, 670] },
          { str: '125', transform: [10, 0, 0, 10, 220, 670] },
        ],
      })),
      cleanup: vi.fn(),
    });
  });

  it('builds an XLSX worksheet from positioned PDF table text', async () => {
    const output = await convertPdfToExcel(new Uint8Array([37, 80, 68, 70]).buffer);
    const zip = await JSZip.loadAsync(output);
    const worksheetXml = await zip.file('xl/worksheets/sheet1.xml')?.async('text');

    expect(worksheetXml).toContain('A1');
    expect(worksheetXml).toContain('B2');
    expect(worksheetXml).toContain('Hosting');
    expect(worksheetXml).toContain('125');
  });

  it('rejects empty PDF input', async () => {
    await expect(convertPdfToExcel(new ArrayBuffer(0))).rejects.toThrow('empty PDF');
  });
});
