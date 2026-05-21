import { GlobalWorkerOptions, VerbosityLevel, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';

const PDFJS_WORKER_SRC = '/assets/pdf.worker.min.mjs';
const PREVIEW_WORKER_URL = '/workers/preview.worker.js';
const DEFAULT_PREVIEW_WIDTH = 240;
const OUTPUT_MIME_TYPE = 'image/png';

GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;

export interface PreviewOptions {
  width?: number;
}

export async function generatePagePreviews(file: Blob, options: PreviewOptions = {}): Promise<string[]> {
  const data = await file.arrayBuffer();
  const width = options.width ?? DEFAULT_PREVIEW_WIDTH;

  if (canUsePreviewWorker()) {
    try {
      return await renderPreviewsInWorker(data, width);
    } catch {
      return renderPreviewsOnMainThread(data, width);
    }
  }

  return renderPreviewsOnMainThread(data, width);
}

export function revokePreviewUrls(urls: string[]) {
  urls.filter((url) => url.startsWith('blob:')).forEach((url) => URL.revokeObjectURL(url));
}

async function renderPreviewsInWorker(data: ArrayBuffer, width: number): Promise<string[]> {
  const worker = new Worker(PREVIEW_WORKER_URL, { type: 'module', name: 'ihatepdf-preview-worker' });
  const jobId = crypto.randomUUID();

  return new Promise<string[]>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<{ jobId: string; status: 'success' | 'error'; result?: string[]; error?: string }>) => {
      if (event.data.jobId !== jobId) {
        return;
      }

      worker.terminate();

      if (event.data.status === 'error') {
        reject(new Error(event.data.error ?? 'Preview worker failed.'));
        return;
      }

      resolve(event.data.result ?? []);
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message || 'Preview worker failed.'));
    };
    worker.postMessage({ jobId, type: 'generate-previews', payload: { data, width } });
  });
}

async function renderPreviewsOnMainThread(data: ArrayBuffer, width: number): Promise<string[]> {
  const pdf = await loadPdf(data);

  try {
    const previews: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      previews.push(await renderPagePreview(pdf, pageNumber, width));
    }

    return previews;
  } finally {
    await pdf.destroy();
  }
}

function canUsePreviewWorker(): boolean {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';
}

async function loadPdf(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  try {
    return await getDocument({ data, verbosity: VerbosityLevel.ERRORS }).promise;
  } catch (error) {
    throw new Error(error instanceof Error ? `Unable to read PDF previews: ${error.message}` : 'Unable to read PDF previews.');
  }
}

async function renderPagePreview(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  targetWidth: number,
): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const scale = targetWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas rendering is unavailable in this browser.');
  }

  canvas.width = Math.ceil(scaledViewport.width);
  canvas.height = Math.ceil(scaledViewport.height);

  await page.render({
    canvasContext: context,
    viewport: scaledViewport,
  }).promise;

  page.cleanup();
  return canvas.toDataURL(OUTPUT_MIME_TYPE);
}
