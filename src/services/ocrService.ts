import Tesseract from 'tesseract.js';
import { initDB, type IHatePdfDb, type TesseractCacheRecord } from '../db/localDb';
import { generatePagePreviews } from './previewService';

const DEFAULT_LANGUAGE_CODE = 'eng';
const LANGUAGE_VERSION = '4.0.0_best_int';
const LANGUAGE_BASE_URL = 'https://cdn.jsdelivr.net/npm/@tesseract.js-data';
const TESSERACT_WORKER_PATH = `${window.location.origin}/assets/tesseract/worker.min.js`;
const TESSERACT_CORE_PATH = `${window.location.origin}/assets/tesseract`;

type OcrImage = Blob | string | ImageData | HTMLCanvasElement | OffscreenCanvas;

export interface OcrOptions {
  languageCode?: string;
  languageBaseUrl?: string;
  previewWidth?: number;
}

export interface CachedLanguageModel {
  code: string;
  data: Uint8Array;
  source: 'indexeddb' | 'network';
}

export function buildLanguageModelUrl(languageCode: string, baseUrl = LANGUAGE_BASE_URL): string {
  return `${baseUrl.replace(/\/$/, '')}/${languageCode}/${LANGUAGE_VERSION}/${languageCode}.traineddata.gz`;
}

export async function ensureLanguageModel(
  languageCode = DEFAULT_LANGUAGE_CODE,
  options: Pick<OcrOptions, 'languageBaseUrl'> = {},
): Promise<CachedLanguageModel> {
  const db = await initDB();
  const cachedModel = await db.get('tesseract_cache', languageCode);

  if (cachedModel) {
    return toCachedLanguageModel(cachedModel, 'indexeddb');
  }

  const modelData = await fetchLanguageModel(languageCode, options.languageBaseUrl);
  const record: TesseractCacheRecord = {
    languageCode,
    modelData,
    timestamp: Date.now(),
  };

  await db.put('tesseract_cache', record);
  return toCachedLanguageModel(record, 'network');
}

export async function recognizeImage(image: OcrImage, options: OcrOptions = {}): Promise<string> {
  const languageModel = await ensureLanguageModel(options.languageCode, options);
  const worker = await createOcrWorker(languageModel);

  try {
    const result = await worker.recognize(image);
    return result.data.text.trim();
  } finally {
    await worker.terminate();
  }
}

export async function recognizePdfPages(file: Blob, options: OcrOptions = {}): Promise<string[]> {
  const previews = await generatePagePreviews(file, { width: options.previewWidth ?? 1600 });
  const languageModel = await ensureLanguageModel(options.languageCode, options);
  const worker = await createOcrWorker(languageModel);

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

async function createOcrWorker(languageModel: CachedLanguageModel) {
  return Tesseract.createWorker(
    [{ code: languageModel.code, data: languageModel.data }],
    Tesseract.OEM.LSTM_ONLY,
    {
      cacheMethod: 'none',
      corePath: TESSERACT_CORE_PATH,
      gzip: true,
      workerPath: TESSERACT_WORKER_PATH,
      logger: (message) => {
        if (message.status === 'failed') {
          console.error('Tesseract Worker Error:', message);
        }
      },
    },
  );
}

async function fetchLanguageModel(languageCode: string, baseUrl?: string): Promise<ArrayBuffer> {
  const response = await fetch(buildLanguageModelUrl(languageCode, baseUrl));

  if (!response.ok) {
    throw new Error(`Unable to download OCR language model "${languageCode}".`);
  }

  return response.arrayBuffer();
}

function toCachedLanguageModel(
  record: Pick<TesseractCacheRecord, 'languageCode' | 'modelData'>,
  source: CachedLanguageModel['source'],
): CachedLanguageModel {
  return {
    code: record.languageCode,
    data: new Uint8Array(record.modelData.slice(0)),
    source,
  };
}
