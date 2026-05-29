import type { ToolType } from '../types';

export type ConversionMode = 'high-fidelity' | 'editable' | 'local-only';
export type ConversionEngine = 'browser' | 'libreoffice' | 'chromium' | 'docling' | 'pdfium' | 'tesseract';
export type FallbackPolicy = 'none' | 'browser';

export interface ConversionRequest {
  sourceMimeType: string;
  targetMimeType: string;
  mode: ConversionMode;
  fileName: string;
  file: Blob;
  options: Record<string, unknown>;
  tool: ToolType;
}

export interface ConversionResult {
  blob: Blob;
  fileName: string;
  mimeType: string;
  engine: ConversionEngine;
  warnings: string[];
  durationMs: number;
  fallbackUsed: boolean;
  pageCount?: number;
}

export interface LocalConversionResult {
  buffer: ArrayBuffer;
  fileName: string;
  mimeType: string;
  warnings?: string[];
}

const SERVICE_URL = normalizeServiceUrl(import.meta.env.VITE_CONVERSION_SERVICE_URL);

export function isConversionServiceConfigured(): boolean {
  return SERVICE_URL !== null;
}

export function getPreferredEngine(tool: ToolType, mode: ConversionMode): ConversionEngine {
  if (mode === 'local-only') return 'browser';

  switch (tool) {
    case 'wordToPdf':
    case 'powerPointToPdf':
    case 'excelToPdf':
      return 'libreoffice';
    case 'htmlToPdf':
      return 'chromium';
    case 'pdfToJpg':
      return 'pdfium';
    case 'pdfToWord':
    case 'pdfToExcel':
    case 'pdfToPowerPoint':
      return 'docling';
    case 'ocr':
      return 'tesseract';
    default:
      return 'browser';
  }
}

export function getEngineLabel(engine: ConversionEngine): string {
  switch (engine) {
    case 'browser':
      return 'Processed locally';
    case 'libreoffice':
      return 'Processed with LibreOffice headless';
    case 'chromium':
      return 'Processed with Chromium';
    case 'docling':
      return 'Processed with Docling';
    case 'pdfium':
      return 'Processed with PDF rasterizer';
    case 'tesseract':
      return 'Processed with Tesseract';
  }
}

export async function convertWithGateway(
  request: ConversionRequest,
  runLocalFallback: () => Promise<LocalConversionResult>,
): Promise<ConversionResult> {
  const startedAt = performance.now();
  const preferredEngine = getPreferredEngine(request.tool, request.mode);
  const fallbackPolicy: FallbackPolicy = request.mode === 'local-only' || preferredEngine === 'browser'
    ? 'browser'
    : 'none';

  if (fallbackPolicy === 'browser') {
    return createLocalResult(await runLocalFallback(), [
      ...localModeWarnings(request.tool, request.mode),
    ], performance.now() - startedAt, true);
  }

  if (!SERVICE_URL) {
    throw new Error(`${getEngineLabel(preferredEngine)} requires VITE_CONVERSION_SERVICE_URL. Choose Local-only to run the lower-fidelity browser converter.`);
  }

  try {
    return await runRemoteConversion(request, preferredEngine, startedAt);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'The conversion service did not return a usable output.';
    throw new Error(`${getEngineLabel(preferredEngine)} failed: ${reason}. Choose Local-only to run the lower-fidelity browser converter.`);
  }
}

async function runRemoteConversion(
  request: ConversionRequest,
  expectedEngine: ConversionEngine,
  startedAt: number,
): Promise<ConversionResult> {
  const body = new FormData();
  body.append('file', request.file, request.fileName);
  body.append('metadata', JSON.stringify({
    sourceMimeType: request.sourceMimeType,
    targetMimeType: request.targetMimeType,
    mode: request.mode,
    fileName: request.fileName,
    tool: request.tool,
    options: request.options,
  }));

  const response = await fetch(`${SERVICE_URL}/convert`, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const mimeType = response.headers.get('content-type')?.split(';')[0] || request.targetMimeType;
  const fileName = response.headers.get('x-conversion-filename') || createConvertedName(request.fileName, mimeType);
  const engine = parseEngine(response.headers.get('x-conversion-engine')) ?? expectedEngine;
  const warnings = parseWarnings(response.headers.get('x-conversion-warnings'));
  const durationMs = parsePositiveNumber(response.headers.get('x-conversion-duration-ms'))
    ?? (performance.now() - startedAt);
  const pageCount = parsePositiveNumber(response.headers.get('x-conversion-page-count'));

  return {
    blob: await response.blob(),
    fileName,
    mimeType,
    engine,
    warnings,
    durationMs,
    fallbackUsed: false,
    pageCount,
  };
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

function createLocalResult(result: LocalConversionResult, warnings: string[], durationMs: number, fallbackUsed: boolean): ConversionResult {
  return {
    blob: new Blob([result.buffer], { type: result.mimeType }),
    fileName: result.fileName,
    mimeType: result.mimeType,
    engine: 'browser',
    warnings: [...warnings, ...(result.warnings ?? [])],
    durationMs,
    fallbackUsed,
  };
}

function localModeWarnings(tool: ToolType, mode: ConversionMode): string[] {
  if (mode !== 'local-only') return [];

  switch (tool) {
    case 'wordToPdf':
    case 'powerPointToPdf':
    case 'excelToPdf':
    case 'htmlToPdf':
      return ['Local-only conversion is best effort and may simplify layout, fonts, charts, images, tables, or pagination.'];
    case 'pdfToWord':
      return ['Editable local export is inferred from PDF text coordinates; scanned pages and complex layouts need OCR or Docling.'];
    case 'pdfToExcel':
      return ['Local table extraction is inferred from PDF text coordinates; verify merged cells and multi-page tables.'];
    case 'pdfToPowerPoint':
      return ['Local PowerPoint export is best effort; visual replica mode through the service is recommended for fidelity.'];
    case 'pdfToJpg':
      return ['Local PDF rendering uses browser PDF.js; use PDFium service mode for large or high-DPI jobs.'];
    default:
      return [];
  }
}

function parseEngine(value: string | null): ConversionEngine | null {
  if (!value) return null;
  return ['browser', 'libreoffice', 'chromium', 'docling', 'pdfium', 'tesseract'].includes(value)
    ? value as ConversionEngine
    : null;
}

function parsePositiveNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseWarnings(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return value.split('\n').map((item) => item.trim()).filter(Boolean);
  }
}

function createConvertedName(fileName: string, mimeType: string): string {
  const baseName = fileName.replace(/\.[^.]+$/i, '') || 'document';

  if (mimeType === 'application/pdf') return `${baseName}-converted.pdf`;
  if (mimeType === 'application/zip') return `${baseName}-converted.zip`;
  if (mimeType.includes('wordprocessingml')) return `${baseName}-converted.docx`;
  if (mimeType.includes('presentationml')) return `${baseName}-converted.pptx`;
  if (mimeType.includes('spreadsheetml')) return `${baseName}-converted.xlsx`;
  return `${baseName}-converted`;
}

function normalizeServiceUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/g, '');
}
