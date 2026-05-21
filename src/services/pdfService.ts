import { workerPool } from './workerPool';
import type { CompressionTier } from './compressionOptions';
import type {
  CropBox,
  ExcelToPdfOptions,
  ImageToPdfInput,
  ImageToPdfOptions,
  OrganizePageRequest,
  PageNumberOptions,
  PdfEditAnnotation,
  PdfFormFillOptions,
  WatermarkOptions,
} from './pdfOperations';
import { convertWordToPdf } from './wordToPdfService';
import { convertPowerPointToPdf } from './powerPointToPdfService';
import { convertExcelToPdf, getExcelSheets } from './excelToPdfService';
import { convertHtmlToPdf } from './htmlToPdfService';
import { convertPdfToJpgArchive } from './pdfToJpgService';

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

export function repairPDF(file: ArrayBuffer): Promise<ArrayBuffer> {
  return workerPool.runJob('pdf', 'repair-pdf', { file }, [file]);
}

export function addPageNumbersPDF(file: ArrayBuffer, options: PageNumberOptions): Promise<ArrayBuffer> {
  return workerPool.runJob('pdf', 'add-page-numbers-pdf', { file, options }, [file]);
}

export function addWatermarkPDF(file: ArrayBuffer, options: WatermarkOptions): Promise<ArrayBuffer> {
  return workerPool.runJob('pdf', 'add-watermark-pdf', { file, options }, [file]);
}

export function cropPDF(file: ArrayBuffer, cropBox: CropBox): Promise<ArrayBuffer> {
  return workerPool.runJob('pdf', 'crop-pdf', { file, cropBox }, [file]);
}

export function editPDF(file: ArrayBuffer, annotations: PdfEditAnnotation[]): Promise<ArrayBuffer> {
  return workerPool.runJob('pdf', 'edit-pdf', { file, annotations }, [file]);
}

export function fillPDFForm(file: ArrayBuffer, options: PdfFormFillOptions): Promise<ArrayBuffer> {
  return workerPool.runJob('pdf', 'fill-pdf-form', { file, options }, [file]);
}

export function imagesToPDF(images: ImageToPdfInput[], options: ImageToPdfOptions): Promise<ArrayBuffer> {
  const transfer = images.map((image) => image.data);
  return workerPool.runJob('pdf', 'images-to-pdf', { images, options }, transfer);
}

export function wordToPDF(file: ArrayBuffer): Promise<ArrayBuffer> {
  return convertWordToPdf(file);
}

export function powerPointToPDF(file: ArrayBuffer): Promise<ArrayBuffer> {
  return convertPowerPointToPdf(file);
}

export function excelToPDF(file: ArrayBuffer, options?: ExcelToPdfOptions): Promise<ArrayBuffer> {
  return convertExcelToPdf(file, options);
}

export function getExcelSheetNames(file: ArrayBuffer): Promise<string[]> {
  return getExcelSheets(file);
}

export function htmlToPDF(file: ArrayBuffer): Promise<ArrayBuffer> {
  return convertHtmlToPdf(file);
}

export function pdfToJpg(file: ArrayBuffer, fileName: string): Promise<ArrayBuffer> {
  return convertPdfToJpgArchive(file, fileName);
}

export function compressPDF(file: ArrayBuffer, tier: CompressionTier = 'recommended'): Promise<ArrayBuffer> {
  return workerPool.runJob('pdf', 'compress-pdf', { file, tier }, [file]);
}
