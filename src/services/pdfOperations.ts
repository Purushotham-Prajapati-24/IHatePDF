import {
  degrees,
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFField,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  rgb,
  StandardFonts,
  type PDFImage,
  type PDFFont,
} from 'pdf-lib';
import type { SplitRange } from './pdfService';

export type PageNumberPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type PageNumberFont = 'helvetica' | 'times-roman' | 'courier';

export interface PageNumberOptions {
  position: PageNumberPosition;
  format: string;
  font: PageNumberFont;
  color: string;
  size: number;
  margin: number;
}

export interface WatermarkOptions {
  type?: 'text' | 'image';
  text: string;
  image?: Blob | null;
  imageName?: string | null;
  imageData?: ArrayBuffer | null;
  imageMimeType?: ImageToPdfMimeType | null;
  opacity: number;
  rotation: number;
  font: PageNumberFont;
  color: string;
  size: number;
}

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfPoint {
  x: number;
  y: number;
}

interface BaseEditAnnotation {
  pageIndex: number;
  viewportWidth: number;
  viewportHeight: number;
  color: string;
  opacity?: number;
}

export interface PdfTextAnnotation extends BaseEditAnnotation {
  type: 'text';
  text: string;
  x: number;
  y: number;
  size: number;
}

export interface PdfRectangleAnnotation extends BaseEditAnnotation {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  borderWidth?: number;
}

export interface PdfInkAnnotation extends BaseEditAnnotation {
  type: 'ink';
  points: PdfPoint[];
  width: number;
}

export type PdfEditAnnotation = PdfTextAnnotation | PdfRectangleAnnotation | PdfInkAnnotation;

export interface PdfFormFieldValue {
  name: string;
  value: string | boolean | string[];
}

export interface PdfFormFillOptions {
  fields: PdfFormFieldValue[];
  flatten: boolean;
}

export type ImageToPdfMimeType = 'image/jpeg' | 'image/png';
export type ImageToPdfPageSize = 'image' | 'a4';
export type ImageToPdfOrientation = 'portrait' | 'landscape';

export interface ImageToPdfInput {
  fileName: string;
  mimeType: ImageToPdfMimeType;
  data: ArrayBuffer;
}

export interface ImageToPdfOptions {
  pageSize: ImageToPdfPageSize;
  orientation: ImageToPdfOrientation;
  margin: number;
}

export interface ExcelToPdfOptions {
  selectedSheets: string[];
  orientation: ImageToPdfOrientation;
  pageSize: ImageToPdfPageSize;
}

export interface HtmlToPdfOptions {
  pageSize: ImageToPdfPageSize;
  orientation: ImageToPdfOrientation;
  margin: number;
}

export interface PdfToPowerPointOptions {
  layout: '16x9' | '4x3';
  includeImages: boolean;
  fontFace: string;
}

export async function mergePdfBuffers(files: ArrayBuffer[]): Promise<ArrayBuffer> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const sourcePdf = await PDFDocument.load(file);
    const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return toExactArrayBuffer(await mergedPdf.save());
}

export async function splitPdfBuffer(file: ArrayBuffer, ranges: SplitRange[]): Promise<ArrayBuffer[]> {
  const sourcePdf = await PDFDocument.load(file);

  return Promise.all(
    ranges.map(async (range) => {
      const splitPdf = await PDFDocument.create();
      const pageIndexes = createPageIndexes(range.start, range.end);
      const copiedPages = await splitPdf.copyPages(sourcePdf, pageIndexes);
      copiedPages.forEach((page) => splitPdf.addPage(page));
      return toExactArrayBuffer(await splitPdf.save());
    }),
  );
}

export async function rotatePdfBuffer(file: ArrayBuffer, rotations: number[]): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.load(file);

  pdf.getPages().forEach((page, index) => {
    page.setRotation(degrees(normalizeRotation(rotations[index] ?? 0)));
  });

  return toExactArrayBuffer(await pdf.save());
}

export interface OrganizePageRequest {
  pageIndex: number;
  rotation: number;
}

export async function organizePdfBuffer(file: ArrayBuffer, pages: OrganizePageRequest[]): Promise<ArrayBuffer> {
  const sourcePdf = await PDFDocument.load(file);
  const organizedPdf = await PDFDocument.create();

  if (pages.length === 0) {
    throw new Error('Select at least one page to organize.');
  }

  for (const pageRequest of pages) {
    const copiedPages = await organizedPdf.copyPages(sourcePdf, [pageRequest.pageIndex]);
    const [copiedPage] = copiedPages;
    copiedPage.setRotation(degrees(normalizeRotation(pageRequest.rotation)));
    organizedPdf.addPage(copiedPage);
  }

  return toExactArrayBuffer(await organizedPdf.save());
}

export async function repairPdfBuffer(file: ArrayBuffer): Promise<ArrayBuffer> {
  assertRepairableInput(file);

  try {
    return await normalizePdf(file);
  } catch {
    const repairedBytes = rebuildPdfTrailer(new Uint8Array(file));
    return normalizePdf(toExactArrayBuffer(repairedBytes));
  }
}

export async function addPageNumbersToPdfBuffer(file: ArrayBuffer, options: PageNumberOptions): Promise<ArrayBuffer> {
  assertRepairableInput(file);
  assertPageNumberOptions(options);
  const pdf = await PDFDocument.load(file);
  const pages = pdf.getPages();

  if (pages.length === 0) {
    throw new Error('Cannot add page numbers to a PDF with no pages.');
  }

  const font = await pdf.embedFont(getStandardFont(options.font));
  const color = parseHexColor(options.color);

  pages.forEach((page, index) => {
    const text = formatPageNumber(options.format, index + 1, pages.length);
    const { x, y } = calculatePageNumberPosition(page.getSize(), text, font, options);
    page.drawText(text, { x, y, size: options.size, font, color });
  });

  return toExactArrayBuffer(await pdf.save());
}

export async function addWatermarkToPdfBuffer(file: ArrayBuffer, options: WatermarkOptions): Promise<ArrayBuffer> {
  assertRepairableInput(file);
  const watermarkOptions = assertWatermarkOptions(options);
  const pdf = await PDFDocument.load(file);
  const pages = pdf.getPages();

  if (pages.length === 0) {
    throw new Error('Cannot add a watermark to a PDF with no pages.');
  }

  if (watermarkOptions.type === 'image') {
    const image = await embedWatermarkImage(pdf, watermarkOptions);
    pages.forEach((page) => drawCenteredImageWatermark(page, watermarkOptions, image));
  } else {
    const font = await pdf.embedFont(getStandardFont(watermarkOptions.font));
    const color = parseHexColor(watermarkOptions.color);

    pages.forEach((page) => drawCenteredTextWatermark(page, watermarkOptions, font, color));
  }

  return toExactArrayBuffer(await pdf.save());
}

export async function cropPdfBuffer(file: ArrayBuffer, cropBox: CropBox): Promise<ArrayBuffer> {
  assertRepairableInput(file);
  const pdf = await PDFDocument.load(file);
  const pages = pdf.getPages();

  if (pages.length === 0) {
    throw new Error('Cannot crop a PDF with no pages.');
  }

  pages.forEach((page) => {
    const validatedCropBox = assertCropBox(cropBox, page.getSize());
    page.setMediaBox(validatedCropBox.x, validatedCropBox.y, validatedCropBox.width, validatedCropBox.height);
    page.setCropBox(validatedCropBox.x, validatedCropBox.y, validatedCropBox.width, validatedCropBox.height);
  });

  return toExactArrayBuffer(await pdf.save());
}

export async function editPdfBuffer(file: ArrayBuffer, annotations: PdfEditAnnotation[]): Promise<ArrayBuffer> {
  assertRepairableInput(file);
  assertEditAnnotations(annotations);
  const pdf = await PDFDocument.load(file);
  const pages = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  annotations.forEach((annotation) => {
    const page = pages[annotation.pageIndex];

    if (!page) {
      throw new Error(`Invalid edit page index: ${annotation.pageIndex}.`);
    }

    drawEditAnnotation(page, annotation, font);
  });

  return toExactArrayBuffer(await pdf.save());
}

export async function fillPdfFormBuffer(file: ArrayBuffer, options: PdfFormFillOptions): Promise<ArrayBuffer> {
  assertRepairableInput(file);
  assertFormFillOptions(options);
  const pdf = await PDFDocument.load(file);
  const form = pdf.getForm();

  options.fields.forEach((fieldValue) => {
    const field = form.getFieldMaybe(fieldValue.name);

    if (!field) {
      throw new Error(`PDF form field was not found: ${fieldValue.name}.`);
    }

    applyFormFieldValue(field, fieldValue.value);
  });

  if (options.flatten) {
    form.flatten();
  }

  return toExactArrayBuffer(await pdf.save());
}

export async function imagesToPdfBuffer(
  images: ImageToPdfInput[],
  options: ImageToPdfOptions = { pageSize: 'image', orientation: 'portrait', margin: 0 },
): Promise<ArrayBuffer> {
  assertImageInputs(images);
  assertImageToPdfOptions(options);
  const pdf = await PDFDocument.create();

  for (const image of images) {
    const embeddedImage = await embedImage(pdf, image);
    const pageLayout = createImagePageLayout(embeddedImage, options);
    const page = pdf.addPage([pageLayout.pageWidth, pageLayout.pageHeight]);

    page.drawImage(embeddedImage, {
      x: pageLayout.x,
      y: pageLayout.y,
      width: pageLayout.width,
      height: pageLayout.height,
    });
  }

  return toExactArrayBuffer(await pdf.save());
}

async function normalizePdf(file: ArrayBuffer): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.load(file, { ignoreEncryption: true });
  return toExactArrayBuffer(await pdf.save({ useObjectStreams: false }));
}

function createPageIndexes(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start - 1 + index);
}

function normalizeRotation(rotation: number): number {
  return ((rotation % 360) + 360) % 360;
}

function formatPageNumber(format: string, pageNumber: number, totalPages: number): string {
  const template = format.trim() || '{n}';
  return template.split('{n}').join(String(pageNumber)).split('{total}').join(String(totalPages));
}

function getStandardFont(font: PageNumberFont) {
  switch (font) {
    case 'times-roman':
      return StandardFonts.TimesRoman;
    case 'courier':
      return StandardFonts.Courier;
    case 'helvetica':
      return StandardFonts.Helvetica;
  }
}

function calculatePageNumberPosition(
  pageSize: { width: number; height: number },
  text: string,
  font: PDFFont,
  options: PageNumberOptions,
): { x: number; y: number } {
  const textWidth = font.widthOfTextAtSize(text, options.size);
  const textHeight = font.heightAtSize(options.size);
  const horizontal = getHorizontalPosition(options.position, pageSize.width, textWidth, options.margin);
  const y = options.position.startsWith('top')
    ? pageSize.height - options.margin - textHeight
    : options.margin;

  return { x: horizontal, y };
}

function drawCenteredTextWatermark(
  page: ReturnType<PDFDocument['getPages']>[number],
  options: Required<Pick<WatermarkOptions, 'text' | 'opacity' | 'rotation' | 'size'>>,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
): void {
  const { width, height } = page.getSize();
  const textWidth = font.widthOfTextAtSize(options.text, options.size);
  const textHeight = font.heightAtSize(options.size);

  page.drawText(options.text, {
    x: (width - textWidth) / 2,
    y: (height - textHeight) / 2,
    size: options.size,
    font,
    color,
    opacity: options.opacity,
    rotate: degrees(normalizeRotation(options.rotation)),
  });
}

function drawCenteredImageWatermark(
  page: ReturnType<PDFDocument['getPages']>[number],
  options: Required<Pick<WatermarkOptions, 'opacity' | 'rotation' | 'size'>>,
  image: PDFImage,
): void {
  const { width, height } = page.getSize();
  const maxWidth = width * (options.size / 100);
  const maxHeight = height * 0.9;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  const imageWidth = image.width * scale;
  const imageHeight = image.height * scale;

  page.drawImage(image, {
    x: (width - imageWidth) / 2,
    y: (height - imageHeight) / 2,
    width: imageWidth,
    height: imageHeight,
    opacity: options.opacity,
    rotate: degrees(normalizeRotation(options.rotation)),
  });
}

async function embedWatermarkImage(pdf: PDFDocument, options: WatermarkOptions): Promise<PDFImage> {
  const data = options.imageData;

  if (!(data instanceof ArrayBuffer) || data.byteLength === 0) {
    throw new Error('Choose a PNG or JPG watermark image.');
  }

  if (options.imageMimeType === 'image/png') return pdf.embedPng(data);
  if (options.imageMimeType === 'image/jpeg') return pdf.embedJpg(data);
  throw new Error('Watermark image must be a PNG or JPG file.');
}

function drawEditAnnotation(
  page: ReturnType<PDFDocument['getPages']>[number],
  annotation: PdfEditAnnotation,
  font: PDFFont,
): void {
  if (annotation.type === 'text') {
    drawTextAnnotation(page, annotation, font);
    return;
  }

  if (annotation.type === 'rectangle') {
    drawRectangleAnnotation(page, annotation);
    return;
  }

  drawInkAnnotation(page, annotation);
}

function applyFormFieldValue(
  field: PDFField,
  value: PdfFormFieldValue['value'],
): void {
  if (field instanceof PDFTextField) {
    field.setText(String(value));
    return;
  }

  if (field instanceof PDFCheckBox) {
    Boolean(value) ? field.check() : field.uncheck();
    return;
  }

  if (field instanceof PDFDropdown || field instanceof PDFOptionList || field instanceof PDFRadioGroup) {
    applyChoiceFieldValue(field, value);
    return;
  }

  throw new Error('Unsupported PDF form field type.');
}

function applyChoiceFieldValue(
  field: PDFDropdown | PDFOptionList | PDFRadioGroup,
  value: PdfFormFieldValue['value'],
): void {
  if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
    const values = Array.isArray(value) ? value : [String(value)];
    values.length === 0 ? field.clear() : field.select(values);
    return;
  }

  const selection = String(Array.isArray(value) ? value[0] ?? '' : value);
  selection.length === 0 ? field.clear() : field.select(selection);
}

function drawTextAnnotation(
  page: ReturnType<PDFDocument['getPages']>[number],
  annotation: PdfTextAnnotation,
  font: PDFFont,
): void {
  const { width, height } = page.getSize();
  const point = mapViewportPoint(annotation, { width, height }, { x: annotation.x, y: annotation.y });

  page.drawText(annotation.text, {
    x: point.x,
    y: point.y - scaleViewportLength(annotation.size, annotation.viewportHeight, height),
    size: scaleViewportLength(annotation.size, annotation.viewportHeight, height),
    font,
    color: parseHexColor(annotation.color),
    opacity: annotation.opacity ?? 1,
  });
}

function drawRectangleAnnotation(
  page: ReturnType<PDFDocument['getPages']>[number],
  annotation: PdfRectangleAnnotation,
): void {
  const { width, height } = page.getSize();
  const topLeft = mapViewportPoint(annotation, { width, height }, { x: annotation.x, y: annotation.y });
  const rectWidth = scaleViewportLength(annotation.width, annotation.viewportWidth, width);
  const rectHeight = scaleViewportLength(annotation.height, annotation.viewportHeight, height);

  page.drawRectangle({
    x: topLeft.x,
    y: topLeft.y - rectHeight,
    width: rectWidth,
    height: rectHeight,
    borderColor: parseHexColor(annotation.color),
    borderWidth: annotation.borderWidth ?? 2,
    opacity: annotation.opacity ?? 1,
  });
}

function drawInkAnnotation(
  page: ReturnType<PDFDocument['getPages']>[number],
  annotation: PdfInkAnnotation,
): void {
  const { width, height } = page.getSize();
  const mappedPoints = annotation.points.map((point) => mapViewportPoint(annotation, { width, height }, point));
  const [firstPoint, ...remainingPoints] = mappedPoints;
  const path = [
    `M ${formatPathNumber(firstPoint.x)} ${formatPathNumber(firstPoint.y)}`,
    ...remainingPoints.map((point) => `L ${formatPathNumber(point.x)} ${formatPathNumber(point.y)}`),
  ].join(' ');

  page.drawSvgPath(path, {
    borderColor: parseHexColor(annotation.color),
    borderWidth: scaleViewportLength(annotation.width, annotation.viewportWidth, width),
    opacity: annotation.opacity ?? 1,
  });
}

function mapViewportPoint(
  annotation: Pick<BaseEditAnnotation, 'viewportWidth' | 'viewportHeight'>,
  pageSize: { width: number; height: number },
  point: PdfPoint,
): PdfPoint {
  return {
    x: scaleViewportLength(point.x, annotation.viewportWidth, pageSize.width),
    y: pageSize.height - scaleViewportLength(point.y, annotation.viewportHeight, pageSize.height),
  };
}

function scaleViewportLength(value: number, viewportLength: number, pageLength: number): number {
  return (value / viewportLength) * pageLength;
}

function formatPathNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function getHorizontalPosition(position: PageNumberPosition, pageWidth: number, textWidth: number, margin: number): number {
  if (position.endsWith('center')) {
    return (pageWidth - textWidth) / 2;
  }

  return position.endsWith('right') ? pageWidth - margin - textWidth : margin;
}

function parseHexColor(color: string) {
  const match = color.trim().match(/^#?([0-9a-f]{6})$/i);

  if (!match) {
    throw new Error('Page number color must be a 6-digit hex color.');
  }

  const value = Number.parseInt(match[1], 16);
  return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

function assertPageNumberOptions(options: PageNumberOptions): void {
  if (!Number.isFinite(options.size) || options.size < 6 || options.size > 72) {
    throw new Error('Page number size must be between 6 and 72 points.');
  }

  if (!Number.isFinite(options.margin) || options.margin < 0 || options.margin > 300) {
    throw new Error('Page number margin must be between 0 and 300 points.');
  }
}

function assertWatermarkOptions(options: WatermarkOptions): WatermarkOptions {
  const type = options.type ?? 'text';

  if (type === 'text' && options.text.trim().length === 0) {
    throw new Error('Watermark text is required.');
  }

  if (type === 'image' && !(options.imageData instanceof ArrayBuffer)) {
    throw new Error('Choose a PNG or JPG watermark image.');
  }

  if (!Number.isFinite(options.opacity) || options.opacity < 0 || options.opacity > 1) {
    throw new Error('Watermark opacity must be between 0 and 1.');
  }

  const minSize = type === 'image' ? 5 : 6;
  const maxSize = type === 'image' ? 90 : 144;

  if (!Number.isFinite(options.size) || options.size < minSize || options.size > maxSize) {
    throw new Error(type === 'image'
      ? 'Watermark image size must be between 5 and 90 percent.'
      : 'Watermark size must be between 6 and 144 points.');
  }

  return { ...options, type };
}

function assertCropBox(cropBox: CropBox, pageSize: { width: number; height: number }): CropBox {
  const values = [cropBox.x, cropBox.y, cropBox.width, cropBox.height];

  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error('Crop bounds must be finite numbers.');
  }

  if (cropBox.x < 0 || cropBox.y < 0 || cropBox.width <= 0 || cropBox.height <= 0) {
    throw new Error('Crop bounds must stay inside the page and have positive dimensions.');
  }

  if (cropBox.x + cropBox.width > pageSize.width || cropBox.y + cropBox.height > pageSize.height) {
    throw new Error('Crop bounds exceed the PDF page dimensions.');
  }

  return cropBox;
}

function assertEditAnnotations(annotations: PdfEditAnnotation[]): void {
  if (!Array.isArray(annotations) || annotations.length === 0) {
    throw new Error('Add at least one edit annotation before editing this PDF.');
  }

  annotations.forEach((annotation) => {
    if (!Number.isInteger(annotation.pageIndex) || annotation.pageIndex < 0) {
      throw new Error(`Invalid edit page index: ${annotation.pageIndex}.`);
    }

    if (annotation.viewportWidth <= 0 || annotation.viewportHeight <= 0) {
      throw new Error('Edit annotations require positive viewport dimensions.');
    }

    assertEditAnnotationShape(annotation);
  });
}

function assertEditAnnotationShape(annotation: PdfEditAnnotation): void {
  if (annotation.type === 'text' && annotation.text.trim().length === 0) {
    throw new Error('Text annotations require text.');
  }

  if (annotation.type === 'rectangle' && (annotation.width <= 0 || annotation.height <= 0)) {
    throw new Error('Rectangle annotations require positive dimensions.');
  }

  if (annotation.type === 'ink' && (annotation.points.length < 2 || annotation.width <= 0)) {
    throw new Error('Ink annotations require at least two points and a positive width.');
  }
}

function assertFormFillOptions(options: PdfFormFillOptions): void {
  if (!Array.isArray(options.fields) || options.fields.length === 0) {
    throw new Error('Add at least one form field value before filling this PDF.');
  }

  options.fields.forEach((field) => {
    if (field.name.trim().length === 0) {
      throw new Error('PDF form field names cannot be empty.');
    }
  });
}

async function embedImage(pdf: PDFDocument, image: ImageToPdfInput): Promise<PDFImage> {
  return image.mimeType === 'image/png'
    ? pdf.embedPng(image.data)
    : pdf.embedJpg(image.data);
}

function createImagePageLayout(image: PDFImage, options: ImageToPdfOptions) {
  if (options.pageSize === 'image') {
    return { pageWidth: image.width, pageHeight: image.height, x: 0, y: 0, width: image.width, height: image.height };
  }

  const isPortrait = options.orientation === 'portrait';
  const pageWidth = isPortrait ? 595.28 : 841.89;
  const pageHeight = isPortrait ? 841.89 : 595.28;
  const maxWidth = pageWidth - options.margin * 2;
  const maxHeight = pageHeight - options.margin * 2;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;

  return { pageWidth, pageHeight, x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height };
}

function assertImageInputs(images: ImageToPdfInput[]): void {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('Add at least one JPG or PNG image before converting to PDF.');
  }

  images.forEach((image) => {
    if (image.data.byteLength === 0) {
      throw new Error(`Image file is empty: ${image.fileName}.`);
    }

    if (image.mimeType !== 'image/jpeg' && image.mimeType !== 'image/png') {
      throw new Error(`Unsupported image type: ${image.fileName}.`);
    }
  });
}

function assertImageToPdfOptions(options: ImageToPdfOptions): void {
  if (options.pageSize !== 'image' && options.pageSize !== 'a4') {
    throw new Error('Image to PDF page size must be image or a4.');
  }

  if (options.orientation !== 'portrait' && options.orientation !== 'landscape') {
    throw new Error('Image to PDF orientation must be portrait or landscape.');
  }

  if (!Number.isFinite(options.margin) || options.margin < 0 || options.margin > 200) {
    throw new Error('Image to PDF margin must be between 0 and 200 points.');
  }
}

function assertRepairableInput(file: ArrayBuffer): void {
  if (file.byteLength === 0) {
    throw new Error('Cannot repair an empty PDF file.');
  }
}

function rebuildPdfTrailer(bytes: Uint8Array): Uint8Array {
  const source = bytesToBinaryString(bytes);
  const objectOffsets = findPdfObjectOffsets(source);

  if (objectOffsets.size === 0) {
    throw new Error('No PDF objects were found to repair.');
  }

  const rootObjectNumber = findCatalogObjectNumber(source, objectOffsets);

  if (!rootObjectNumber) {
    throw new Error('Unable to locate a PDF catalog for repair.');
  }

  return appendRebuiltXref(bytes, objectOffsets, rootObjectNumber);
}

function findPdfObjectOffsets(source: string): Map<number, number> {
  const offsets = new Map<number, number>();
  const objectPattern = /(^|\s)(\d+)\s+(\d+)\s+obj\b/g;

  for (const match of source.matchAll(objectPattern)) {
    const objectNumber = Number(match[2]);
    const objectStart = match.index + match[1].length;

    if (Number.isSafeInteger(objectNumber) && objectNumber > 0) {
      offsets.set(objectNumber, objectStart);
    }
  }

  return offsets;
}

function findCatalogObjectNumber(source: string, objectOffsets: Map<number, number>): number | null {
  for (const objectNumber of objectOffsets.keys()) {
    const objectBody = readObjectBody(source, objectNumber);

    if (/\/Type\s*\/Catalog\b/.test(objectBody)) {
      return objectNumber;
    }
  }

  return null;
}

function readObjectBody(source: string, objectNumber: number): string {
  const objectPattern = new RegExp(`\\b${objectNumber}\\s+\\d+\\s+obj\\b`);
  const objectStart = source.search(objectPattern);

  if (objectStart === -1) {
    return '';
  }

  const endIndex = source.indexOf('endobj', objectStart);
  return endIndex === -1 ? source.slice(objectStart) : source.slice(objectStart, endIndex);
}

function appendRebuiltXref(
  originalBytes: Uint8Array,
  objectOffsets: Map<number, number>,
  rootObjectNumber: number,
): Uint8Array {
  const sourceText = bytesToBinaryString(originalBytes);
  const bodyText = stripTrailingRepairSections(sourceText).trimEnd();
  const xrefStart = bodyText.length + 1;
  const maxObjectNumber = Math.max(...objectOffsets.keys());
  const xrefText = createXrefSection(objectOffsets, maxObjectNumber, rootObjectNumber, xrefStart);

  return binaryStringToBytes(`${bodyText}\n${xrefText}`);
}

function stripTrailingRepairSections(source: string): string {
  const lastEndObject = source.lastIndexOf('endobj');

  if (lastEndObject === -1) {
    return source;
  }

  return source.slice(0, lastEndObject + 'endobj'.length);
}

function createXrefSection(
  objectOffsets: Map<number, number>,
  maxObjectNumber: number,
  rootObjectNumber: number,
  xrefStart: number,
): string {
  const rows = ['xref', `0 ${maxObjectNumber + 1}`, '0000000000 65535 f '];

  for (let objectNumber = 1; objectNumber <= maxObjectNumber; objectNumber += 1) {
    const offset = objectOffsets.get(objectNumber);
    rows.push(offset === undefined ? '0000000000 65535 f ' : `${String(offset).padStart(10, '0')} 00000 n `);
  }

  rows.push('trailer', `<< /Size ${maxObjectNumber + 1} /Root ${rootObjectNumber} 0 R >>`);
  rows.push('startxref', String(xrefStart), '%%EOF');
  return `${rows.join('\n')}\n`;
}

function bytesToBinaryString(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
}

function binaryStringToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);

  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }

  return bytes;
}

function toExactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}
