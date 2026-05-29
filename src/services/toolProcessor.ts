import type { FileMetadata, SelectedPage, ToolType } from '../types';
import type { CompressionTier } from './compressionOptions';
import type {
  CropBox,
  ExcelToPdfOptions,
  HtmlToPdfOptions,
  ImageToPdfInput,
  ImageToPdfOptions,
  PageNumberOptions,
  PdfEditAnnotation,
  PdfFormFillOptions,
  PdfToPowerPointOptions,
  WatermarkOptions,
} from './pdfOperations';
import { addPageNumbersPDF, addWatermarkPDF, compressPDF, cropPDF, editPDF, excelToPDF, fillPDFForm, htmlToPDF, imagesToPDF, mergePDFs, organizePDF, pdfToExcel, pdfToJpg, pdfToPdfA, pdfToPowerPoint, pdfToWord, powerPointToPDF, repairPDF, rotatePDF, splitPDF, wordToPDF } from './pdfService';
import { recognizePdfPages } from './ocrService';
import { protectPdfWithPassword, unlockPdfWithPassword } from './qpdfService';
import { parseSplitRanges } from './splitRanges';
import { createZipArchive } from '../utils/zipFiles';
import { convertWithGateway, getEngineLabel, isConversionServiceConfigured, type ConversionEngine, type ConversionMode } from './conversionGateway';

export interface ToolExecutionConfig {
  compressionTier: CompressionTier;
  splitRangeInput: string;
  ocrLanguage: string;
  protectPassword: string;
  protectConfirmPassword: string;
  unlockPassword: string;
  pageNumberOptions: PageNumberOptions;
  watermarkOptions: WatermarkOptions;
  cropBox: CropBox;
  editAnnotations: PdfEditAnnotation[];
  formFillOptions: PdfFormFillOptions;
  imageToPdfOptions: ImageToPdfOptions;
  excelToPdfOptions: ExcelToPdfOptions;
  htmlToPdfOptions: HtmlToPdfOptions;
  pdfToPowerPointOptions: PdfToPowerPointOptions;
  conversionMode?: ConversionMode | null;
  conversionServiceConfirmed?: boolean;
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
  engine?: ConversionEngine;
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
    case 'repair':
      return {
        outputBuffer: await repairPDF(primaryBuffer),
        outputFileName: createProcessedFileName(primaryFile.name, 'repaired'),
        outputMimeType: 'application/pdf',
      };
    case 'addPageNumbers':
      return {
        outputBuffer: await addPageNumbersPDF(primaryBuffer, request.config.pageNumberOptions),
        outputFileName: createProcessedFileName(primaryFile.name, 'numbered'),
        outputMimeType: 'application/pdf',
      };
    case 'addWatermark':
      return {
        outputBuffer: await addWatermarkPDF(primaryBuffer, request.config.watermarkOptions),
        outputFileName: createProcessedFileName(primaryFile.name, 'watermarked'),
        outputMimeType: 'application/pdf',
      };
    case 'crop':
      return {
        outputBuffer: await cropPDF(primaryBuffer, request.config.cropBox),
        outputFileName: createProcessedFileName(primaryFile.name, 'cropped'),
        outputMimeType: 'application/pdf',
      };
    case 'edit':
      return {
        outputBuffer: await editPDF(primaryBuffer, request.config.editAnnotations),
        outputFileName: createProcessedFileName(primaryFile.name, 'edited'),
        outputMimeType: 'application/pdf',
      };
    case 'forms':
      return {
        outputBuffer: await fillPDFForm(primaryBuffer, request.config.formFillOptions),
        outputFileName: createProcessedFileName(primaryFile.name, 'filled'),
        outputMimeType: 'application/pdf',
      };
    case 'jpgToPdf':
      return {
        outputBuffer: await imagesToPDF(createImageInputs(request.files, request.buffers), request.config.imageToPdfOptions),
        outputFileName: createImagePdfFileName(request.files),
        outputMimeType: 'application/pdf',
      };
    case 'wordToPdf':
      return runGatewayConversion(request, primaryFile, primaryBuffer, 'application/pdf', async () => ({
        buffer: await wordToPDF(primaryBuffer),
        fileName: createConvertedPdfFileName(primaryFile.name),
        mimeType: 'application/pdf',
      }));
    case 'powerPointToPdf':
      return runGatewayConversion(request, primaryFile, primaryBuffer, 'application/pdf', async () => ({
        buffer: await powerPointToPDF(primaryBuffer),
        fileName: createConvertedPdfFileName(primaryFile.name),
        mimeType: 'application/pdf',
      }));
    case 'excelToPdf':
      return runGatewayConversion(request, primaryFile, primaryBuffer, 'application/pdf', async () => ({
        buffer: await excelToPDF(primaryBuffer, request.config.excelToPdfOptions),
        fileName: createConvertedPdfFileName(primaryFile.name),
        mimeType: 'application/pdf',
      }));
    case 'htmlToPdf':
      return runGatewayConversion(request, primaryFile, primaryBuffer, 'application/pdf', async () => ({
        buffer: await htmlToPDF(primaryBuffer),
        fileName: createConvertedPdfFileName(primaryFile.name),
        mimeType: 'application/pdf',
      }));
    case 'pdfToJpg':
      return runGatewayConversion(request, primaryFile, primaryBuffer, 'application/zip', async () => ({
        buffer: await pdfToJpg(primaryBuffer, primaryFile.name),
        fileName: createConvertedArchiveName(primaryFile.name, 'jpg'),
        mimeType: 'application/zip',
      }));
    case 'pdfToWord':
      return runGatewayConversion(request, primaryFile, primaryBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', async () => ({
        buffer: await pdfToWord(primaryBuffer),
        fileName: createConvertedDocumentName(primaryFile.name, 'docx'),
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }));
    case 'pdfToPowerPoint':
      return runGatewayConversion(request, primaryFile, primaryBuffer, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', async () => ({
        buffer: await pdfToPowerPoint(primaryBuffer, request.config.pdfToPowerPointOptions),
        fileName: createConvertedDocumentName(primaryFile.name, 'pptx'),
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      }));
    case 'pdfToExcel':
      return runGatewayConversion(request, primaryFile, primaryBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', async () => ({
        buffer: await pdfToExcel(primaryBuffer),
        fileName: createConvertedDocumentName(primaryFile.name, 'xlsx'),
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));
    case 'pdfToPdfA':
      return {
        outputBuffer: await pdfToPdfA(primaryBuffer),
        outputFileName: createProcessedFileName(primaryFile.name, 'pdfa'),
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
    throw new Error('Add at least one file before starting local processing.');
  }

  if (isConversionTool(activeTool) && !config.conversionMode) {
    throw new Error('Choose High fidelity, Editable, or Local-only conversion before starting.');
  }

  if (requiresServicePrivacyConfirmation(activeTool, config)) {
    throw new Error('Confirm self-hosted conversion processing before using high-fidelity mode.');
  }

  if (activeTool === 'jpgToPdf') {
    assertImageFiles(files);
    return;
  }

  if (activeTool === 'wordToPdf') {
    assertSingleDocxFile(files);
    return;
  }

  if (activeTool === 'powerPointToPdf') {
    assertSinglePptxFile(files);
    return;
  }

  if (activeTool === 'excelToPdf') {
    assertSingleExcelFile(files);
    return;
  }

  if (activeTool === 'htmlToPdf') {
    assertSingleHtmlFile(files);
    return;
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

  if (activeTool === 'addWatermark') {
    assertWatermarkConfig(config.watermarkOptions);
  }

}

async function runGatewayConversion(
  request: ToolExecutionRequest,
  primaryFile: FileMetadata,
  primaryBuffer: ArrayBuffer,
  targetMimeType: string,
  runLocalFallback: () => Promise<{ buffer: ArrayBuffer; fileName: string; mimeType: string; warnings?: string[] }>,
): Promise<ToolExecutionResult> {
  const result = await convertWithGateway({
    sourceMimeType: primaryFile.type || inferSourceMimeType(primaryFile.name),
    targetMimeType,
    mode: request.config.conversionMode ?? failMissingConversionMode(),
    fileName: primaryFile.name,
    file: new Blob([primaryBuffer], { type: primaryFile.type || inferSourceMimeType(primaryFile.name) }),
    options: createGatewayOptions(request),
    tool: request.activeTool ?? 'merge',
  }, runLocalFallback);

  const outputBuffer = await result.blob.arrayBuffer();
  return {
    outputBuffer,
    outputFileName: result.fileName,
    outputMimeType: result.mimeType,
    engine: result.engine,
    notice: createConversionNotice(result),
  };
}

function createGatewayOptions(request: ToolExecutionRequest): Record<string, unknown> {
  return {
    excelToPdfOptions: request.config.excelToPdfOptions,
    htmlToPdfOptions: request.config.htmlToPdfOptions,
    pdfToPowerPointOptions: request.config.pdfToPowerPointOptions,
  };
}

function createConversionNotice(result: { engine: ConversionEngine; warnings: string[]; durationMs?: number; fallbackUsed?: boolean; pageCount?: number }): string | undefined {
  const details = result.warnings.filter(Boolean);
  const label = getEngineLabel(result.engine);
  const metadata = [
    typeof result.durationMs === 'number' ? `${Math.round(result.durationMs)}ms` : null,
    typeof result.pageCount === 'number' ? `${result.pageCount} page${result.pageCount === 1 ? '' : 's'}` : null,
    result.fallbackUsed ? 'browser fallback used' : null,
  ].filter(Boolean).join(' | ');

  const prefix = metadata ? `${label} (${metadata})` : label;
  if (details.length === 0) return prefix;
  return `${prefix}. ${details.join(' ')}`;
}

function requiresServicePrivacyConfirmation(activeTool: ToolType, config: ToolExecutionConfig): boolean {
  return isConversionTool(activeTool)
    && isConversionServiceConfigured()
    && config.conversionMode !== 'local-only'
    && Boolean(config.conversionMode)
    && config.conversionServiceConfirmed !== true;
}

function failMissingConversionMode(): never {
  throw new Error('Choose High fidelity, Editable, or Local-only conversion before starting.');
}

function isConversionTool(tool: ToolType): boolean {
  return [
    'wordToPdf',
    'powerPointToPdf',
    'excelToPdf',
    'htmlToPdf',
    'pdfToJpg',
    'pdfToWord',
    'pdfToPowerPoint',
    'pdfToExcel',
  ].includes(tool);
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

function createImageInputs(files: FileMetadata[], buffers: ArrayBuffer[]): ImageToPdfInput[] {
  return files.map((file, index) => ({
    fileName: file.name,
    mimeType: getRequiredImageMimeType(file),
    data: buffers[index],
  }));
}

function assertImageFiles(files: FileMetadata[]): void {
  files.forEach((file) => {
    if (!isSupportedImageFile(file)) {
      throw new Error('JPG to PDF accepts only JPG, JPEG, or PNG image files.');
    }
  });
}

function assertWatermarkConfig(options: WatermarkOptions): void {
  if ((options.type ?? 'text') === 'text') {
    if (options.text.trim().length === 0) {
      throw new Error('Watermark text is required.');
    }
    return;
  }

  if (!options.image) {
    throw new Error('Choose a PNG or JPG watermark image.');
  }

  if (getWatermarkImageMimeType(options.image, options.imageName) === null) {
    throw new Error('Watermark image must be a PNG or JPG file.');
  }
}

function getWatermarkImageMimeType(image: Blob, imageName?: string | null): ImageToPdfInput['mimeType'] | null {
  const name = imageName?.toLowerCase() ?? '';

  if (image.type === 'image/png' || name.endsWith('.png')) return 'image/png';
  if (image.type === 'image/jpeg' || name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  return null;
}

function assertSingleDocxFile(files: FileMetadata[]): void {
  if (files.length !== 1) {
    throw new Error('Word to PDF requires exactly one DOCX file.');
  }

  const [file] = files;
  if (!isDocxFile(file)) {
    throw new Error('Word to PDF accepts only DOCX files.');
  }
}

function isDocxFile(file: FileMetadata): boolean {
  return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    || file.name.toLowerCase().endsWith('.docx');
}

function assertSinglePptxFile(files: FileMetadata[]): void {
  if (files.length !== 1) {
    throw new Error('PowerPoint to PDF requires exactly one PPTX file.');
  }

  const [file] = files;
  if (!isPptxFile(file)) {
    throw new Error('PowerPoint to PDF accepts only PPTX files.');
  }
}

function isPptxFile(file: FileMetadata): boolean {
  return file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    || file.name.toLowerCase().endsWith('.pptx');
}

function assertSingleExcelFile(files: FileMetadata[]): void {
  if (files.length !== 1) {
    throw new Error('Excel to PDF requires exactly one XLSX file.');
  }

  const [file] = files;
  if (!isExcelFile(file)) {
    throw new Error('Excel to PDF accepts only XLSX files.');
  }
}

function isExcelFile(file: FileMetadata): boolean {
  return file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || file.name.toLowerCase().endsWith('.xlsx');
}

function assertSingleHtmlFile(files: FileMetadata[]): void {
  if (files.length !== 1) {
    throw new Error('HTML to PDF requires exactly one HTML file.');
  }

  const [file] = files;
  if (!isHtmlFile(file)) {
    throw new Error('HTML to PDF accepts only HTML files.');
  }
}

function isHtmlFile(file: FileMetadata): boolean {
  const name = file.name.toLowerCase();
  return file.type === 'text/html' || name.endsWith('.html') || name.endsWith('.htm');
}

function isSupportedImageFile(file: FileMetadata): boolean {
  return getImageMimeType(file) !== null;
}

function inferSourceMimeType(fileName: string): string {
  const name = fileName.toLowerCase();
  if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (name.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (name.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (name.endsWith('.html') || name.endsWith('.htm')) return 'text/html';
  if (name.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}

function getImageMimeType(file: FileMetadata): ImageToPdfInput['mimeType'] | null {
  const name = file.name.toLowerCase();

  if (file.type === 'image/png' || name.endsWith('.png')) return 'image/png';
  if (file.type === 'image/jpeg' || name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  return null;
}

function getRequiredImageMimeType(file: FileMetadata): ImageToPdfInput['mimeType'] {
  const mimeType = getImageMimeType(file);

  if (!mimeType) {
    throw new Error(`Unsupported image file: ${file.name}.`);
  }

  return mimeType;
}

function encodeText(text: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(text);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function createProcessedFileName(fileName: string, suffix: string): string {
  const baseName = fileName.replace(/\.pdf$/i, '') || 'document';
  return `${baseName}-${suffix}.pdf`;
}

function createImagePdfFileName(files: FileMetadata[]): string {
  if (files.length > 1) {
    return 'images-converted.pdf';
  }

  const baseName = files[0].name.replace(/\.[^.]+$/i, '') || 'image';
  return `${baseName}-converted.pdf`;
}

function createConvertedPdfFileName(fileName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/i, '') || 'document';
  return `${baseName}-converted.pdf`;
}

function createProcessedTextFileName(fileName: string, suffix: string): string {
  const baseName = fileName.replace(/\.pdf$/i, '') || 'document';
  return `${baseName}-${suffix}.txt`;
}

function createProcessedArchiveName(fileName: string): string {
  const baseName = fileName.replace(/\.pdf$/i, '') || 'document';
  return `${baseName}-split.zip`;
}

function createConvertedArchiveName(fileName: string, suffix: string): string {
  const baseName = fileName.replace(/\.[^.]+$/i, '') || 'document';
  return `${baseName}-${suffix}.zip`;
}

function createConvertedDocumentName(fileName: string, extension: string): string {
  const baseName = fileName.replace(/\.[^.]+$/i, '') || 'document';
  return `${baseName}-converted.${extension}`;
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
