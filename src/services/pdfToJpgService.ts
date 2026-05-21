import { GlobalWorkerOptions, VerbosityLevel, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import { createZipArchive } from '../utils/zipFiles';

const PDFJS_WORKER_SRC = '/assets/pdf.worker.min.mjs';
const JPEG_QUALITY = 0.9;
const RENDER_SCALE = 150 / 72;

GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;

export async function convertPdfToJpgArchive(file: ArrayBuffer, fileName = 'document.pdf'): Promise<ArrayBuffer> {
  assertPdfInput(file);
  const pdf = await loadPdf(file);

  try {
    const entries = [];
    const baseName = fileName.replace(/\.pdf$/i, '') || 'document';

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      entries.push({
        fileName: `${baseName}-page-${pageNumber}.jpg`,
        data: await renderPageAsJpeg(pdf, pageNumber),
      });
    }

    return createZipArchive(entries);
  } finally {
    await pdf.destroy();
  }
}

function assertPdfInput(file: ArrayBuffer): void {
  if (file.byteLength === 0) {
    throw new Error('Cannot convert an empty PDF to JPG.');
  }
}

async function loadPdf(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  try {
    return await getDocument({ data, verbosity: VerbosityLevel.ERRORS }).promise;
  } catch (error) {
    throw new Error(error instanceof Error ? `Unable to read PDF for JPG conversion: ${error.message}` : 'Unable to read PDF for JPG conversion.');
  }
}

async function renderPageAsJpeg(pdf: PDFDocumentProxy, pageNumber: number): Promise<ArrayBuffer> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: RENDER_SCALE });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

  if (!context) {
    throw new Error('Canvas rendering is unavailable for PDF to JPG conversion.');
  }

  if ('fillStyle' in context) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  await page.render({ canvasContext: context as CanvasRenderingContext2D, viewport }).promise;
  page.cleanup();
  return canvasToJpeg(canvas);
}

function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  if (typeof document === 'undefined') {
    throw new Error('Canvas rendering is unavailable for PDF to JPG conversion.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function canvasToJpeg(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<ArrayBuffer> {
  if ('convertToBlob' in canvas) {
    return (await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY })).arrayBuffer();
  }

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  return dataUrlToArrayBuffer(dataUrl);
}

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(',')[1];

  if (!base64) {
    throw new Error('Canvas did not produce a JPEG image.');
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}
