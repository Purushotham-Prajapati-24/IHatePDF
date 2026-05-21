import type { FileMetadata, SelectedPage, ToolType } from '../types';
import type { CompressionTier } from './compressionOptions';
import { compressPDF, mergePDFs, organizePDF, rotatePDF, splitPDF } from './pdfService';
import { recognizePdfPages } from './ocrService';
import { protectPdfWithPassword, unlockPdfWithPassword } from './qpdfService';
import { parseSplitRanges } from './splitRanges';
import { createZipArchive } from '../utils/zipFiles';

export interface ToolExecutionConfig {
  compressionTier: CompressionTier;
  splitRangeInput: string;
  ocrLanguage: string;
  protectPassword: string;
  protectConfirmPassword: string;
  unlockPassword: string;
}

export interface ToolExecutionRequest {
  activeTool: ToolType | null;
  files: FileMetadata[];
  buffers: ArrayBuffer[];
  selectedPages: SelectedPage[];
  config: ToolExecutionConfig;
}

export interface ToolExecutionResult {
  outputBuffer: ArrayBuffer;
  outputFileName: string;
  outputMimeType: string;
  notice?: string;
}

export async function processActiveTool(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
  validateToolRequest(request);

  const primaryFile = request.files[0];
  const primaryBuffer = request.buffers[0];

  switch (request.activeTool) {
    case 'merge':
      return {
        outputBuffer: await mergePDFs(request.buffers),
        outputFileName: 'merged-document.pdf',
        outputMimeType: 'application/pdf',
      };
    case 'compress': {
      const compression = await compressWithFallback(primaryBuffer, request.config.compressionTier);
      return {
        outputBuffer: compression.outputBuffer,
        outputFileName: createProcessedFileName(primaryFile.name, 'compressed'),
        outputMimeType: 'application/pdf',
        notice: compression.notice,
      };
    }
    case 'rotate':
      return {
        outputBuffer: await rotatePDF(primaryBuffer, createRotationPlan(primaryFile, request.selectedPages)),
        outputFileName: createProcessedFileName(primaryFile.name, 'rotated'),
        outputMimeType: 'application/pdf',
      };
    case 'split': {
      const ranges = parseSplitRanges(request.config.splitRangeInput, primaryFile.totalPages);
      const splitBuffers = await splitPDF(primaryBuffer, ranges);
      const suffix = ranges.length === 1
        ? `split-pages-${ranges[0].start}-${ranges[0].end}`
        : `split-${ranges.length}-ranges`;

      if (splitBuffers.length <= 1) {
        return {
          outputBuffer: splitBuffers[0] ?? primaryBuffer,
          outputFileName: createProcessedFileName(primaryFile.name, suffix),
          outputMimeType: 'application/pdf',
        };
      }

      return {
        outputBuffer: createZipArchive(createSplitZipEntries(primaryFile.name, ranges, splitBuffers)),
        outputFileName: createProcessedArchiveName(primaryFile.name),
        outputMimeType: 'application/zip',
      };
    }
    case 'organize':
      return {
        outputBuffer: await organizePDF(primaryBuffer, createOrganizePlan(primaryFile, request.selectedPages)),
        outputFileName: createProcessedFileName(primaryFile.name, 'organized'),
        outputMimeType: 'application/pdf',
      };
    case 'ocr': {
      const pageTexts = await recognizePdfPages(primaryFile.blob, { languageCode: request.config.ocrLanguage });
      return {
        outputBuffer: encodeText(createOcrText(pageTexts)),
        outputFileName: createProcessedTextFileName(primaryFile.name, 'ocr'),
        outputMimeType: 'text/plain',
      };
    }
    case 'protect':
      return {
        outputBuffer: await protectPdfWithPassword(primaryBuffer, request.config.protectPassword),
        outputFileName: createProcessedFileName(primaryFile.name, 'protected'),
        outputMimeType: 'application/pdf',
      };
    case 'unlock':
      return {
        outputBuffer: await unlockPdfWithPassword(primaryBuffer, request.config.unlockPassword),
        outputFileName: createProcessedFileName(primaryFile.name, 'unlocked'),
        outputMimeType: 'application/pdf',
      };
    default:
      throw new Error('Unsupported PDF tool.');
  }
}

export function validateToolRequest(request: Pick<ToolExecutionRequest, 'activeTool' | 'files' | 'config'>): void {
  const { activeTool, files, config } = request;

  if (!activeTool) {
    throw new Error('Choose a PDF tool before starting local processing.');
  }

  if (files.length === 0) {
    throw new Error('Add at least one PDF before starting local processing.');
  }

  if (activeTool === 'merge') {
    if (files.length < 2) {
      throw new Error('Merge PDF requires at least two PDF files.');
    }
    return;
  }

  if (files.length !== 1) {
    throw new Error(`${getToolLabel(activeTool)} requires exactly one PDF file.`);
  }

  if (activeTool === 'protect') {
    if (config.protectPassword.length === 0) {
      throw new Error('Enter a password before protecting this PDF.');
    }

    if (config.protectPassword !== config.protectConfirmPassword) {
      throw new Error('The protect password confirmation does not match.');
    }
  }

  if (activeTool === 'unlock' && config.unlockPassword.length === 0) {
    throw new Error('Enter the PDF password before unlocking this file.');
  }
}

async function compressWithFallback(
  file: ArrayBuffer,
  compressionTier: CompressionTier,
): Promise<{ outputBuffer: ArrayBuffer; notice?: string }> {
  try {
    const compressedFile = await compressPDF(file.slice(0), compressionTier);

    if (compressedFile.byteLength < file.byteLength) {
      return { outputBuffer: compressedFile };
    }

    return {
      outputBuffer: file.slice(0),
      notice: 'Compression did not reduce this PDF, so the original file was kept.',
    };
  } catch (error) {
    if (isCompressionCapabilityError(error)) {
      return {
        outputBuffer: file.slice(0),
        notice: 'Browser compression is unavailable for this file, so the original PDF was kept.',
      };
    }

    throw error;
  }
}

function isCompressionCapabilityError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return /offscreen|canvas|createelement|document|image|render|pdf\.js|worker/i.test(error.message);
}

function createRotationPlan(file: FileMetadata, selectedPages: SelectedPage[]): number[] {
  const pageCount = file.totalPages ?? selectedPages.filter((page) => page.fileId === file.id).length;
  const rotationsByIndex = new Map(
    selectedPages
      .filter((page) => page.fileId === file.id)
      .map((page) => [page.pageIndex, page.rotation]),
  );

  if (pageCount > 0) {
    return Array.from({ length: pageCount }, (_, pageIndex) => rotationsByIndex.get(pageIndex) ?? file.rotation ?? 0);
  }

  return [file.rotation ?? 0];
}

function createOrganizePlan(file: FileMetadata, selectedPages: SelectedPage[]) {
  const filePages = selectedPages.filter((page) => page.fileId === file.id);

  if (filePages.length === 0) {
    const pageCount = file.totalPages ?? 0;
    return Array.from({ length: pageCount }, (_, pageIndex) => ({
      pageIndex,
      rotation: file.rotation ?? 0,
    }));
  }

  return filePages.map((page) => ({
    pageIndex: page.pageIndex,
    rotation: page.rotation,
  }));
}

function createOcrText(pageTexts: string[]): string {
  if (pageTexts.length === 0) {
    return 'No text detected.';
  }

  return pageTexts
    .map((text, index) => `Page ${index + 1}\n${text || 'No text detected on this page.'}`)
    .join('\n\n');
}

function encodeText(text: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(text);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function createProcessedFileName(fileName: string, suffix: string): string {
  const baseName = fileName.replace(/\.pdf$/i, '') || 'document';
  return `${baseName}-${suffix}.pdf`;
}

function createProcessedTextFileName(fileName: string, suffix: string): string {
  const baseName = fileName.replace(/\.pdf$/i, '') || 'document';
  return `${baseName}-${suffix}.txt`;
}

function createProcessedArchiveName(fileName: string): string {
  const baseName = fileName.replace(/\.pdf$/i, '') || 'document';
  return `${baseName}-split.zip`;
}

function createSplitZipEntries(fileName: string, ranges: Array<{ start: number; end: number }>, splitBuffers: ArrayBuffer[]) {
  const baseName = fileName.replace(/\.pdf$/i, '') || 'document';

  return splitBuffers.map((buffer, index) => {
    const range = ranges[index];
    const rangeName = range ? `pages-${range.start}-${range.end}` : `part-${index + 1}`;

    return {
      fileName: `${baseName}-${rangeName}.pdf`,
      data: buffer,
    };
  });
}

function getToolLabel(tool: ToolType): string {
  return `${tool.charAt(0).toUpperCase()}${tool.slice(1)} PDF`;
}
