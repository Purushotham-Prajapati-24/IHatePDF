import { GlobalWorkerOptions, VerbosityLevel, getDocument, type PDFDocumentProxy, OPS } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { PdfToPowerPointOptions } from './pdfOperations';

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

interface SlideImage {
  data: string; // Base64
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PdfSlide {
  width: number;
  height: number;
  texts: SlideText[];
  images: SlideImage[];
}

export async function convertPdfToPowerPoint(file: ArrayBuffer, options?: PdfToPowerPointOptions): Promise<ArrayBuffer> {
  assertPdfInput(file);
  const pdf = await loadPdf(file);

  const finalOptions: PdfToPowerPointOptions = options ?? {
    layout: '16x9',
    includeImages: true,
    fontFace: 'Arial',
  };

  try {
    const slides = await extractSlides(pdf, finalOptions);
    if (slides.every((slide) => slide.texts.length === 0 && slide.images.length === 0)) {
      throw new Error('No readable content was found in this PDF.');
    }

    return createPresentation(slides, finalOptions);
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

async function extractSlides(pdf: PDFDocumentProxy, options: PdfToPowerPointOptions): Promise<PdfSlide[]> {
  const slides: PdfSlide[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    
    // Extract Text
    const content = await page.getTextContent();
    const texts = content.items
      .filter((item): item is PdfTextItem => isPdfTextItem(item))
      .map((item) => toSlideText(item, viewport.width, viewport.height))
      .filter((item) => item.text.length > 0);

    // Extract Images (Heuristic)
    const images: SlideImage[] = [];
    if (options.includeImages) {
      try {
        const ops = await page.getOperatorList();
        for (let i = 0; i < ops.fnArray.length; i++) {
          if (ops.fnArray[i] === OPS.paintXObject) {
            const imgName = ops.argsArray[i][0];
            const img = await new Promise<any>((resolve) => {
               page.objs.get(imgName, (obj: any) => resolve(obj));
            });

            if (img && img.data) {
              let transform = [1, 0, 0, 1, 0, 0];
              for (let j = i - 1; j >= 0; j--) {
                if (ops.fnArray[j] === OPS.transform) {
                  transform = ops.argsArray[j];
                  break;
                }
              }

              const canvas = createCanvas(img.width, img.height);
              const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
              
              if (ctx) {
                const imageData = ctx.createImageData(img.width, img.height);
                if (img.data.length === img.width * img.height * 3) {
                  for (let k = 0, l = 0; k < img.data.length; k += 3, l += 4) {
                    imageData.data[l] = img.data[k];
                    imageData.data[l+1] = img.data[k+1];
                    imageData.data[l+2] = img.data[k+2];
                    imageData.data[l+3] = 255;
                  }
                } else {
                   imageData.data.set(img.data);
                }
                ctx.putImageData(imageData, 0, 0);
                
                let dataUrl: string;
                if ('toDataURL' in canvas) {
                   dataUrl = (canvas as HTMLCanvasElement).toDataURL('image/png');
                } else {
                   const blob = await (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' });
                   dataUrl = await blobToDataUrl(blob);
                }

                images.push({
                  data: dataUrl,
                  x: (transform[4] / viewport.width) * SLIDE_WIDTH,
                  y: ((viewport.height - transform[5] - transform[3]) / viewport.height) * SLIDE_HEIGHT,
                  w: (transform[0] / viewport.width) * SLIDE_WIDTH,
                  h: (transform[3] / viewport.height) * SLIDE_HEIGHT,
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to extract images from page', pageNumber, e);
      }
    }

    slides.push({ width: viewport.width, height: viewport.height, texts, images });
    page.cleanup();
  }

  return slides;
}

function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  if (typeof document === 'undefined') {
    throw new Error('Canvas rendering is unavailable.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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

async function createPresentation(slides: PdfSlide[], options: PdfToPowerPointOptions): Promise<ArrayBuffer> {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();
  
  const layoutMap = {
    '16x9': 'LAYOUT_16x9',
    '4x3': 'LAYOUT_4x3',
  };
  
  pptx.layout = (layoutMap[options.layout] || 'LAYOUT_16x9') as any;
  pptx.author = 'IHatePDF';
  pptx.subject = 'Converted PDF';
  pptx.title = 'Converted PDF';

  slides.forEach((page) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    
    // Add Images first (as background layer)
    page.images.forEach((img) => {
      slide.addImage({
        data: img.data,
        x: clamp(img.x, 0, SLIDE_WIDTH),
        y: clamp(img.y, 0, SLIDE_HEIGHT),
        w: Math.max(0.1, img.w),
        h: Math.max(0.1, img.h),
      });
    });

    // Add Text
    page.texts.forEach((text) => {
      slide.addText(text.text, {
        x: clamp(text.x, 0, SLIDE_WIDTH - 0.2),
        y: clamp(text.y, 0, SLIDE_HEIGHT - 0.2),
        w: Math.max(0.5, SLIDE_WIDTH - text.x),
        h: 0.25,
        fontFace: options.fontFace,
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
