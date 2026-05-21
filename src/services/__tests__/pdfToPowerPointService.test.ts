import { beforeEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import { convertPdfToPowerPoint } from '../pdfToPowerPointService';

const getPage = vi.fn();

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  VerbosityLevel: { ERRORS: 0 },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 2,
      destroy: vi.fn(async () => undefined),
      getPage,
    }),
  })),
}));

describe('pdfToPowerPointService', () => {
  beforeEach(() => {
    getPage.mockImplementation(async (pageNumber: number) => ({
      getViewport: vi.fn(() => ({ width: 600, height: 400 })),
      getTextContent: vi.fn(async () => ({
        items: [
          { str: `Slide ${pageNumber}`, transform: [18, 0, 0, 18, 50, 350], width: 80, height: 18 },
        ],
      })),
      cleanup: vi.fn(),
    }));
  });

  it('maps each PDF page into an editable PPTX slide', async () => {
    const output = await convertPdfToPowerPoint(new Uint8Array([37, 80, 68, 70]).buffer);
    const zip = await JSZip.loadAsync(output);
    const slideNames = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
    const firstSlideXml = await zip.file('ppt/slides/slide1.xml')?.async('text');

    expect(slideNames).toEqual(['ppt/slides/slide1.xml', 'ppt/slides/slide2.xml']);
    expect(firstSlideXml).toContain('Slide 1');
  });

  it('rejects empty PDF input', async () => {
    await expect(convertPdfToPowerPoint(new ArrayBuffer(0))).rejects.toThrow('empty PDF');
  });
});
