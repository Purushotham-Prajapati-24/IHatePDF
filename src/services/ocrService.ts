import Tesseract from 'tesseract.js';
import { generatePagePreviews } from './previewService';

const DEFAULT_LANGUAGE_CODE = 'eng';
const LANGUAGE_VERSION = '4.0.0_best_int';
const LANGUAGE_BASE_URL = 'https://cdn.jsdelivr.net/npm/@tesseract.js-data';
const ASSET_ORIGIN = globalThis.location?.origin ?? '';
const TESSERACT_WORKER_PATH = `${ASSET_ORIGIN}/assets/tesseract/worker.min.js`;
const TESSERACT_CORE_PATH = `${ASSET_ORIGIN}/assets/tesseract`;

type OcrImage = Blob | string | ImageData | HTMLCanvasElement | OffscreenCanvas;

export interface OcrOptions {
  languageCode?: string;
  languageBaseUrl?: string;
  previewWidth?: number;
}

export function buildLanguageModelUrl(languageCode: string, baseUrl = LANGUAGE_BASE_URL): string {
  return `${baseUrl.replace(/\/$/, '')}/${languageCode}/${LANGUAGE_VERSION}/${languageCode}.traineddata.gz`;
}

export async function recognizeImage(image: OcrImage, options: OcrOptions = {}): Promise<string> {
  const worker = await createOcrWorker(options.languageCode || DEFAULT_LANGUAGE_CODE);

  try {
    const result = await worker.recognize(image);
    return result.data.text.trim();
  } finally {
    await worker.terminate();
  }
}

export async function recognizePdfPages(file: Blob, options: OcrOptions = {}): Promise<string[]> {
  const previews = await generatePagePreviews(file, { width: options.previewWidth ?? 1600 });
  const worker = await createOcrWorker(options.languageCode || DEFAULT_LANGUAGE_CODE);

  try {
    const pageTexts: string[] = [];

    for (const preview of previews) {
      const result = await worker.recognize(preview);
      pageTexts.push(result.data.text.trim());
    }

    return pageTexts;
  } finally {
    await worker.terminate();
  }
}

async function createOcrWorker(languageCode: string) {
  const langPath = `${LANGUAGE_BASE_URL}/${languageCode}/${LANGUAGE_VERSION}`;
  
  return Tesseract.createWorker(languageCode, Tesseract.OEM.LSTM_ONLY, {
    cacheMethod: 'indexedDB',
    langPath,
    corePath: TESSERACT_CORE_PATH,
    workerPath: TESSERACT_WORKER_PATH,
    gzip: true,
  });
}
