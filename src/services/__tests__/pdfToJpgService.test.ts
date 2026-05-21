import { beforeEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import { convertPdfToJpgArchive } from '../pdfToJpgService';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  VerbosityLevel: { ERRORS: 0 },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 3,
      destroy: vi.fn(async () => undefined),
      getPage: vi.fn(async () => ({
        getViewport: vi.fn(() => ({ width: 100, height: 120 })),
        render: vi.fn(() => ({ promise: Promise.resolve() })),
        cleanup: vi.fn(),
      })),
    }),
  })),
}));

describe('pdfToJpgService', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({ fillStyle: '', fillRect: vi.fn() })),
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,/9j/2Q=='),
      })),
    });
  });

  it('packages every PDF page as a JPG entry', async () => {
    const archive = await convertPdfToJpgArchive(new Uint8Array([37, 80, 68, 70]).buffer, 'scan.pdf');
    const zip = await JSZip.loadAsync(archive);

    expect(Object.keys(zip.files)).toEqual(['scan-page-1.jpg', 'scan-page-2.jpg', 'scan-page-3.jpg']);
  });

  it('rejects empty PDF input', async () => {
    await expect(convertPdfToJpgArchive(new ArrayBuffer(0))).rejects.toThrow('empty PDF');
  });
});
