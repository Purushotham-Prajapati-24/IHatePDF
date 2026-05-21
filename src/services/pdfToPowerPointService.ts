import { GlobalWorkerOptions, VerbosityLevel, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

const PDFJS_WORKER_SRC = '/assets/pdf.worker.min.mjs';
const SLIDE_WIDTH = 10;
const SLIDE_HEIGHT = 5.625;
const MIN_FONT_SIZE = 8;

GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;

interface PdfTextItem extends TextItem {
  transform: number[];
}

interface SlideText {
  text: string;
  x: number;
  y: number;
  fontSize: number;
}

interface PdfSlide {
  width: number;
  height: number;
  texts: SlideText[];
}

export async function convertPdfToPowerPoint(file: ArrayBuffer): Promise<ArrayBuffer> {
  assertPdfInput(file);
  const pdf = await loadPdf(file);

  try {
    const slides = await extractSlides(pdf);
    if (slides.every((slide) => slide.texts.length === 0)) {
      throw new Error('No readable text was found in this PDF.');
    }

    return createPresentation(slides);
  } finally {
    await pdf.destroy();
  }
}

function assertPdfInput(file: ArrayBuffer): void {
  if (file.byteLength === 0) {
    throw new Error('Cannot convert an empty PDF to PowerPoint.');
  }
}

async function loadPdf(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  try {
    return await getDocument({ data, verbosity: VerbosityLevel.ERRORS }).promise;
  } catch (error) {
    throw new Error(error instanceof Error ? `Unable to read PDF for PowerPoint conversion: ${error.message}` : 'Unable to read PDF for PowerPoint conversion.');
  }
}

async function extractSlides(pdf: PDFDocumentProxy): Promise<PdfSlide[]> {
  const slides: PdfSlide[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const texts = content.items
      .filter((item): item is PdfTextItem => isPdfTextItem(item))
      .map((item) => toSlideText(item, viewport.width, viewport.height))
      .filter((item) => item.text.length > 0);

    slides.push({ width: viewport.width, height: viewport.height, texts });
    page.cleanup();
  }

  return slides;
}

function isPdfTextItem(item: unknown): item is PdfTextItem {
  if (typeof item !== 'object' || item === null) return false;

  const candidate = item as Partial<PdfTextItem>;
  return typeof candidate.str === 'string'
    && Array.isArray(candidate.transform)
    && candidate.transform.length >= 6;
}

function toSlideText(item: PdfTextItem, pageWidth: number, pageHeight: number): SlideText {
  const fontSize = Math.max(Math.round(Math.abs(item.transform[0])), MIN_FONT_SIZE);

  return {
    text: item.str.replace(/\s+/g, ' ').trim(),
    x: (item.transform[4] / pageWidth) * SLIDE_WIDTH,
    y: ((pageHeight - item.transform[5]) / pageHeight) * SLIDE_HEIGHT,
    fontSize,
  };
}

async function createPresentation(slides: PdfSlide[]): Promise<ArrayBuffer> {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16X9';
  pptx.author = 'IHatePDF';
  pptx.subject = 'Converted PDF';
  pptx.title = 'Converted PDF';

  slides.forEach((page) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    page.texts.forEach((text) => {
      slide.addText(text.text, {
        x: clamp(text.x, 0, SLIDE_WIDTH - 0.2),
        y: clamp(text.y, 0, SLIDE_HEIGHT - 0.2),
        w: Math.max(0.5, SLIDE_WIDTH - text.x),
        h: 0.25,
        fontFace: 'Arial',
        fontSize: text.fontSize,
        color: '111111',
        margin: 0,
        breakLine: false,
        fit: 'shrink',
      });
    });
  });

  return toArrayBuffer(await pptx.write({ outputType: 'arraybuffer' }));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toArrayBuffer(output: string | ArrayBuffer | Blob | Uint8Array): ArrayBuffer {
  if (output instanceof ArrayBuffer) return output;
  if (output instanceof Uint8Array) {
    const buffer = new ArrayBuffer(output.byteLength);
    new Uint8Array(buffer).set(output);
    return buffer;
  }

  throw new Error('PowerPoint generation returned an unsupported output type.');
}
