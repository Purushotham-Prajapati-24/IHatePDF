import { workerPool } from './workerPool';
import type { CompressionTier } from './compressionOptions';
import type { OrganizePageRequest } from './pdfOperations';

export interface SplitRange {
  start: number;
  end: number;
}

export function mergePDFs(files: ArrayBuffer[]): Promise<ArrayBuffer> {
  return workerPool.runJob('pdf', 'merge-pdfs', { files }, files);
}

export function splitPDF(file: ArrayBuffer, ranges: SplitRange[]): Promise<ArrayBuffer[]> {
  return workerPool.runJob('pdf', 'split-pdf', { file, ranges }, [file]);
}

export function rotatePDF(file: ArrayBuffer, rotations: number[]): Promise<ArrayBuffer> {
  return workerPool.runJob('pdf', 'rotate-pdf', { file, rotations }, [file]);
}

export function organizePDF(file: ArrayBuffer, pages: OrganizePageRequest[]): Promise<ArrayBuffer> {
  return workerPool.runJob('pdf', 'organize-pdf', { file, pages }, [file]);
}

export function compressPDF(file: ArrayBuffer, tier: CompressionTier = 'recommended'): Promise<ArrayBuffer> {
  return workerPool.runJob('pdf', 'compress-pdf', { file, tier }, [file]);
}
