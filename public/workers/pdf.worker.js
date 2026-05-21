self.importScripts('/assets/pdf-lib.min.js');

const { PDFDocument, degrees } = self.PDFLib;
const PDFJS_MODULE_URL = '/assets/pdf.min.mjs';
const PDFJS_WORKER_SRC = '/assets/pdf.worker.min.mjs';
const COMPRESSION_SETTINGS = {
  extreme: { dpi: 72, jpegQuality: 0.62 },
  recommended: { dpi: 150, jpegQuality: 0.76 },
  low: { dpi: 220, jpegQuality: 0.86 },
};

let pdfjsModulePromise;

self.onmessage = async (event) => {
  const { jobId, type, payload } = event.data ?? {};

  try {
    if (!jobId || typeof type !== 'string') {
      throw new Error('Invalid PDF worker message.');
    }

    if (type === 'ping') {
      self.postMessage({ jobId, status: 'success', result: { worker: 'pdf', ready: true } });
      return;
    }

    if (type === 'echo-buffers') {
      const buffers = Array.isArray(payload?.buffers) ? payload.buffers : [];
      const totalBytes = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);

      self.postMessage({
        jobId,
        status: 'success',
        result: {
          worker: 'pdf',
          receivedBuffers: buffers.length,
          totalBytes,
        },
      });
      return;
    }

    if (type === 'merge-pdfs') {
      const result = await mergePDFs(payload?.files);
      self.postMessage({ jobId, status: 'success', result }, [result]);
      return;
    }

    if (type === 'split-pdf') {
      const result = await splitPDF(payload?.file, payload?.ranges);
      self.postMessage({ jobId, status: 'success', result }, result);
      return;
    }

    if (type === 'rotate-pdf') {
      const result = await rotatePDF(payload?.file, payload?.rotations);
      self.postMessage({ jobId, status: 'success', result }, [result]);
      return;
    }

    if (type === 'organize-pdf') {
      const result = await organizePDF(payload?.file, payload?.pages);
      self.postMessage({ jobId, status: 'success', result }, [result]);
      return;
    }

    if (type === 'repair-pdf') {
      const result = await repairPDF(payload?.file);
      self.postMessage({ jobId, status: 'success', result }, [result]);
      return;
    }

    if (type === 'add-page-numbers-pdf') {
      const result = await addPageNumbersPDF(payload?.file, payload?.options);
      self.postMessage({ jobId, status: 'success', result }, [result]);
      return;
    }

    if (type === 'add-watermark-pdf') {
      const result = await addWatermarkPDF(payload?.file, payload?.options);
      self.postMessage({ jobId, status: 'success', result }, [result]);
      return;
    }

    if (type === 'crop-pdf') {
      const result = await cropPDF(payload?.file, payload?.cropBox);
      self.postMessage({ jobId, status: 'success', result }, [result]);
      return;
    }

    if (type === 'edit-pdf') {
      const result = await editPDF(payload?.file, payload?.annotations);
      self.postMessage({ jobId, status: 'success', result }, [result]);
      return;
    }

    if (type === 'fill-pdf-form') {
      const result = await fillPDFForm(payload?.file, payload?.options);
      self.postMessage({ jobId, status: 'success', result }, [result]);
      return;
    }

    if (type === 'images-to-pdf') {
      const result = await imagesToPDF(payload?.images, payload?.options);
      self.postMessage({ jobId, status: 'success', result }, [result]);
      return;
    }

    if (type === 'compress-pdf') {
      const result = await compressPDF(payload?.file, payload?.tier);
      self.postMessage({ jobId, status: 'success', result }, [result]);
      return;
    }

    throw new Error(`Unsupported PDF worker job: ${type}`);
  } catch (error) {
    self.postMessage({
      jobId: jobId ?? 'unknown',
      status: 'error',
      error: error instanceof Error ? error.message : 'PDF worker failed.',
    });
  }
};

async function mergePDFs(files) {
  const buffers = assertBufferArray(files, 'files');
  const mergedPdf = await PDFDocument.create();

  for (const buffer of buffers) {
    const sourcePdf = await PDFDocument.load(buffer);
    const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return toExactArrayBuffer(await mergedPdf.save());
}

async function splitPDF(file, ranges) {
  const sourcePdf = await PDFDocument.load(assertArrayBuffer(file, 'file'));
  const pageRanges = assertRanges(ranges, sourcePdf.getPageCount());
  const outputs = [];

  for (const range of pageRanges) {
    const nextPdf = await PDFDocument.create();
    const pageIndexes = createPageIndexes(range.start, range.end);
    const copiedPages = await nextPdf.copyPages(sourcePdf, pageIndexes);
    copiedPages.forEach((page) => nextPdf.addPage(page));
    outputs.push(toExactArrayBuffer(await nextPdf.save()));
  }

  return outputs;
}

async function rotatePDF(file, rotations) {
  const pdf = await PDFDocument.load(assertArrayBuffer(file, 'file'));
  const pageRotations = assertRotations(rotations, pdf.getPageCount());

  pdf.getPages().forEach((page, index) => {
    const rotation = normalizeRotation(pageRotations[index] ?? 0);
    page.setRotation(degrees(rotation));
  });

  return toExactArrayBuffer(await pdf.save());
}

async function organizePDF(file, pages) {
  const sourcePdf = await PDFDocument.load(assertArrayBuffer(file, 'file'));
  const pageRequests = assertPageRequests(pages, sourcePdf.getPageCount());
  const outputPdf = await PDFDocument.create();

  for (const pageRequest of pageRequests) {
    const [copiedPage] = await outputPdf.copyPages(sourcePdf, [pageRequest.pageIndex]);
    copiedPage.setRotation(degrees(pageRequest.rotation));
    outputPdf.addPage(copiedPage);
  }

  return toExactArrayBuffer(await outputPdf.save());
}

async function repairPDF(file) {
  const input = assertArrayBuffer(file, 'file');

  if (input.byteLength === 0) {
    throw new Error('Cannot repair an empty PDF file.');
  }

  try {
    return await normalizePDF(input);
  } catch {
    const repairedBytes = rebuildPdfTrailer(new Uint8Array(input));
    return normalizePDF(toExactArrayBuffer(repairedBytes));
  }
}

async function normalizePDF(file) {
  const pdf = await PDFDocument.load(file, { ignoreEncryption: true });
  return toExactArrayBuffer(await pdf.save({ useObjectStreams: false }));
}

async function addPageNumbersPDF(file, options) {
  const input = assertArrayBuffer(file, 'file');
  const pageNumberOptions = assertPageNumberOptions(options);
  const pdf = await PDFDocument.load(input);
  const pages = pdf.getPages();

  if (pages.length === 0) {
    throw new Error('Cannot add page numbers to a PDF with no pages.');
  }

  const font = await pdf.embedFont(getStandardFont(pageNumberOptions.font));
  const color = parseHexColor(pageNumberOptions.color);

  pages.forEach((page, index) => {
    const text = formatPageNumber(pageNumberOptions.format, index + 1, pages.length);
    const { x, y } = calculatePageNumberPosition(page.getSize(), text, font, pageNumberOptions);
    page.drawText(text, { x, y, size: pageNumberOptions.size, font, color });
  });

  return toExactArrayBuffer(await pdf.save());
}

async function addWatermarkPDF(file, options) {
  const input = assertArrayBuffer(file, 'file');
  const watermarkOptions = assertWatermarkOptions(options);
  const pdf = await PDFDocument.load(input);
  const pages = pdf.getPages();

  if (pages.length === 0) {
    throw new Error('Cannot add a watermark to a PDF with no pages.');
  }

  if (watermarkOptions.type === 'image') {
    const image = await embedWatermarkImage(pdf, watermarkOptions);
    pages.forEach((page) => drawCenteredImageWatermark(page, watermarkOptions, image));
    return toExactArrayBuffer(await pdf.save());
  }

  const font = await pdf.embedFont(getStandardFont(watermarkOptions.font));
  const color = parseHexColor(watermarkOptions.color);

  pages.forEach((page) => drawCenteredTextWatermark(page, watermarkOptions, font, color));

  return toExactArrayBuffer(await pdf.save());
}

async function cropPDF(file, cropBox) {
  const input = assertArrayBuffer(file, 'file');
  const pdf = await PDFDocument.load(input);
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

async function editPDF(file, annotations) {
  const input = assertArrayBuffer(file, 'file');
  const editAnnotations = assertEditAnnotations(annotations);
  const pdf = await PDFDocument.load(input);
  const pages = pdf.getPages();
  const font = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);

  editAnnotations.forEach((annotation) => {
    const page = pages[annotation.pageIndex];

    if (!page) {
      throw new Error(`Invalid edit page index: ${annotation.pageIndex}.`);
    }

    drawEditAnnotation(page, annotation, font);
  });

  return toExactArrayBuffer(await pdf.save());
}

async function fillPDFForm(file, options) {
  const input = assertArrayBuffer(file, 'file');
  const formOptions = assertFormFillOptions(options);
  const pdf = await PDFDocument.load(input);
  const form = pdf.getForm();

  formOptions.fields.forEach((fieldValue) => {
    const field = form.getFieldMaybe(fieldValue.name);

    if (!field) {
      throw new Error(`PDF form field was not found: ${fieldValue.name}.`);
    }

    applyFormFieldValue(field, fieldValue.value);
  });

  if (formOptions.flatten) form.flatten();

  return toExactArrayBuffer(await pdf.save());
}

async function imagesToPDF(images, options) {
  const imageInputs = assertImageInputs(images);
  const layoutOptions = assertImageToPdfOptions(options);
  const pdf = await PDFDocument.create();

  for (const image of imageInputs) {
    const embeddedImage = image.mimeType === 'image/png'
      ? await pdf.embedPng(image.data)
      : await pdf.embedJpg(image.data);
    const layout = createImagePageLayout(embeddedImage, layoutOptions);
    const page = pdf.addPage([layout.pageWidth, layout.pageHeight]);

    page.drawImage(embeddedImage, { x: layout.x, y: layout.y, width: layout.width, height: layout.height });
  }

  return toExactArrayBuffer(await pdf.save());
}

async function compressPDF(file, tier) {
  if (typeof OffscreenCanvas === 'undefined') {
    throw new Error('PDF compression requires OffscreenCanvas support.');
  }

  const pdfjs = await loadPdfJs();
  const sourcePdf = await pdfjs.getDocument({
    data: assertArrayBuffer(file, 'file'),
    verbosity: pdfjs.VerbosityLevel.ERRORS,
  }).promise;
  const outputPdf = await PDFDocument.create();
  const settings = getCompressionSettings(tier);

  try {
    for (let pageNumber = 1; pageNumber <= sourcePdf.numPages; pageNumber += 1) {
      const page = await sourcePdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = settings.dpi / 72;
      const viewport = page.getViewport({ scale });
      const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext('2d', { alpha: false });

      if (!context) {
        throw new Error('Unable to create compression canvas context.');
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport }).promise;

      const jpegBlob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: settings.jpegQuality,
      });
      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
      const embeddedImage = await outputPdf.embedJpg(jpegBytes);
      const outputPage = outputPdf.addPage([baseViewport.width, baseViewport.height]);

      outputPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: baseViewport.width,
        height: baseViewport.height,
      });
      page.cleanup();
    }

    return toExactArrayBuffer(await outputPdf.save({ useObjectStreams: true }));
  } finally {
    await sourcePdf.destroy();
  }
}

async function loadPdfJs() {
  pdfjsModulePromise ??= import(PDFJS_MODULE_URL).then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
    return pdfjs;
  });

  return pdfjsModulePromise;
}

function getCompressionSettings(tier) {
  return COMPRESSION_SETTINGS[tier] ?? COMPRESSION_SETTINGS.recommended;
}

function assertArrayBuffer(value, fieldName) {
  if (value instanceof ArrayBuffer) {
    return value;
  }

  throw new Error(`Expected ${fieldName} to be an ArrayBuffer.`);
}

function assertBufferArray(value, fieldName) {
  if (Array.isArray(value) && value.every((entry) => entry instanceof ArrayBuffer)) {
    return value;
  }

  throw new Error(`Expected ${fieldName} to be an array of ArrayBuffers.`);
}

function assertRanges(value, pageCount) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('At least one split range is required.');
  }

  return value.map((range) => {
    const start = Number(range?.start);
    const end = Number(range?.end);

    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > pageCount) {
      throw new Error(`Invalid split range: ${start}-${end}.`);
    }

    return { start, end };
  });
}

function assertRotations(value, pageCount) {
  if (!Array.isArray(value) || value.length !== pageCount) {
    throw new Error(`Expected ${pageCount} rotation values.`);
  }

  return value.map((rotation) => {
    const normalizedRotation = normalizeRotation(Number(rotation));

    if (!Number.isInteger(normalizedRotation)) {
      throw new Error(`Invalid rotation value: ${rotation}.`);
    }

    return normalizedRotation;
  });
}

function assertPageRequests(value, pageCount) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('At least one page is required.');
  }

  return value.map((page) => {
    const pageIndex = Number(page?.pageIndex);
    const rotation = normalizeRotation(Number(page?.rotation));

    if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= pageCount) {
      throw new Error(`Invalid page index: ${pageIndex}.`);
    }

    if (!Number.isInteger(rotation)) {
      throw new Error(`Invalid rotation value: ${page?.rotation}.`);
    }

    return { pageIndex, rotation };
  });
}

function assertPageNumberOptions(value) {
  const options = value && typeof value === 'object' ? value : {};
  const size = Number(options.size ?? 12);
  const margin = Number(options.margin ?? 36);

  if (!Number.isFinite(size) || size < 6 || size > 72) {
    throw new Error('Page number size must be between 6 and 72 points.');
  }

  if (!Number.isFinite(margin) || margin < 0 || margin > 300) {
    throw new Error('Page number margin must be between 0 and 300 points.');
  }

  return {
    position: normalizePageNumberPosition(options.position),
    format: String(options.format || 'Page {n} of {total}'),
    font: normalizePageNumberFont(options.font),
    color: String(options.color || '#111111'),
    size,
    margin,
  };
}

function assertWatermarkOptions(value) {
  const options = value && typeof value === 'object' ? value : {};
  const type = options.type === 'image' ? 'image' : 'text';
  const text = String(options.text || '').trim();
  const opacity = Number(options.opacity ?? 0.3);
  const rotation = Number(options.rotation ?? 45);
  const size = Number(options.size ?? 48);

  if (type === 'text' && text.length === 0) {
    throw new Error('Watermark text is required.');
  }

  if (type === 'image') {
    assertArrayBuffer(options.imageData, 'watermark image');
  }

  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
    throw new Error('Watermark opacity must be between 0 and 1.');
  }

  const minSize = type === 'image' ? 5 : 6;
  const maxSize = type === 'image' ? 90 : 144;

  if (!Number.isFinite(size) || size < minSize || size > maxSize) {
    throw new Error(type === 'image'
      ? 'Watermark image size must be between 5 and 90 percent.'
      : 'Watermark size must be between 6 and 144 points.');
  }

  return {
    type,
    text,
    imageData: options.imageData,
    imageMimeType: options.imageMimeType,
    opacity,
    rotation,
    font: normalizePageNumberFont(options.font),
    color: String(options.color || '#111111'),
    size,
  };
}

function assertCropBox(value, pageSize) {
  const cropBox = value && typeof value === 'object' ? value : {};
  const x = Number(cropBox.x);
  const y = Number(cropBox.y);
  const width = Number(cropBox.width);
  const height = Number(cropBox.height);

  if ([x, y, width, height].some((entry) => !Number.isFinite(entry))) {
    throw new Error('Crop bounds must be finite numbers.');
  }

  if (x < 0 || y < 0 || width <= 0 || height <= 0) {
    throw new Error('Crop bounds must stay inside the page and have positive dimensions.');
  }

  if (x + width > pageSize.width || y + height > pageSize.height) {
    throw new Error('Crop bounds exceed the PDF page dimensions.');
  }

  return { x, y, width, height };
}

function assertEditAnnotations(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Add at least one edit annotation before editing this PDF.');
  }

  return value.map((annotation) => {
    const normalizedAnnotation = normalizeEditAnnotation(annotation);

    if (!Number.isInteger(normalizedAnnotation.pageIndex) || normalizedAnnotation.pageIndex < 0) {
      throw new Error(`Invalid edit page index: ${normalizedAnnotation.pageIndex}.`);
    }

    if (normalizedAnnotation.viewportWidth <= 0 || normalizedAnnotation.viewportHeight <= 0) {
      throw new Error('Edit annotations require positive viewport dimensions.');
    }

    return normalizedAnnotation;
  });
}

function assertFormFillOptions(value) {
  const options = value && typeof value === 'object' ? value : {};
  const fields = Array.isArray(options.fields) ? options.fields : [];

  if (fields.length === 0) {
    throw new Error('Add at least one form field value before filling this PDF.');
  }

  return {
    flatten: Boolean(options.flatten),
    fields: fields.map((field) => {
      const name = String(field?.name || '').trim();

      if (name.length === 0) {
        throw new Error('PDF form field names cannot be empty.');
      }

      return { name, value: field?.value };
    }),
  };
}

function assertImageInputs(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Add at least one JPG or PNG image before converting to PDF.');
  }

  return value.map((image) => {
    const fileName = String(image?.fileName || 'image');
    const mimeType = image?.mimeType;
    const data = assertArrayBuffer(image?.data, fileName);

    if (data.byteLength === 0) {
      throw new Error(`Image file is empty: ${fileName}.`);
    }

    if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
      throw new Error(`Unsupported image type: ${fileName}.`);
    }

    return { fileName, mimeType, data };
  });
}

function assertImageToPdfOptions(value) {
  const options = value && typeof value === 'object' ? value : {};
  const pageSize = options.pageSize === 'a4' ? 'a4' : 'image';
  const margin = Number(options.margin ?? 0);

  if (!Number.isFinite(margin) || margin < 0 || margin > 200) {
    throw new Error('Image to PDF margin must be between 0 and 200 points.');
  }

  return { pageSize, margin };
}

function createImagePageLayout(image, options) {
  if (options.pageSize === 'image') {
    return { pageWidth: image.width, pageHeight: image.height, x: 0, y: 0, width: image.width, height: image.height };
  }

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const maxWidth = pageWidth - options.margin * 2;
  const maxHeight = pageHeight - options.margin * 2;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;

  return { pageWidth, pageHeight, x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height };
}

function normalizeEditAnnotation(value) {
  const annotation = value && typeof value === 'object' ? value : {};
  const type = annotation.type;
  const base = {
    type,
    pageIndex: Number(annotation.pageIndex),
    viewportWidth: Number(annotation.viewportWidth),
    viewportHeight: Number(annotation.viewportHeight),
    color: String(annotation.color || '#111111'),
    opacity: annotation.opacity === undefined ? 1 : Number(annotation.opacity),
  };

  if (type === 'text') return normalizeTextAnnotation(annotation, base);
  if (type === 'rectangle') return normalizeRectangleAnnotation(annotation, base);
  if (type === 'ink') return normalizeInkAnnotation(annotation, base);

  throw new Error('Unsupported edit annotation type.');
}

function normalizeTextAnnotation(annotation, base) {
  const text = String(annotation.text || '').trim();

  if (text.length === 0) {
    throw new Error('Text annotations require text.');
  }

  const textAnnotation = { ...base, text, x: Number(annotation.x), y: Number(annotation.y), size: Number(annotation.size) };

  if ([textAnnotation.x, textAnnotation.y, textAnnotation.size].some((entry) => !Number.isFinite(entry)) || textAnnotation.size <= 0) {
    throw new Error('Text annotations require finite coordinates and a positive size.');
  }

  return textAnnotation;
}

function normalizeRectangleAnnotation(annotation, base) {
  const rectangle = {
    ...base,
    x: Number(annotation.x),
    y: Number(annotation.y),
    width: Number(annotation.width),
    height: Number(annotation.height),
    borderWidth: Number(annotation.borderWidth ?? 2),
  };

  if (
    [rectangle.x, rectangle.y, rectangle.width, rectangle.height, rectangle.borderWidth].some((entry) => !Number.isFinite(entry)) ||
    rectangle.width <= 0 ||
    rectangle.height <= 0 ||
    rectangle.borderWidth < 0
  ) {
    throw new Error('Rectangle annotations require finite coordinates and positive dimensions.');
  }

  return rectangle;
}

function normalizeInkAnnotation(annotation, base) {
  const points = Array.isArray(annotation.points)
    ? annotation.points.map((point) => ({ x: Number(point?.x), y: Number(point?.y) }))
    : [];
  const width = Number(annotation.width);

  if (points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y)) || points.length < 2 || !Number.isFinite(width) || width <= 0) {
    throw new Error('Ink annotations require at least two points and a positive width.');
  }

  return { ...base, points, width };
}

function normalizePageNumberPosition(position) {
  const allowedPositions = new Set(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']);
  return allowedPositions.has(position) ? position : 'bottom-right';
}

function normalizePageNumberFont(font) {
  const allowedFonts = new Set(['helvetica', 'times-roman', 'courier']);
  return allowedFonts.has(font) ? font : 'helvetica';
}

function rebuildPdfTrailer(bytes) {
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

function findPdfObjectOffsets(source) {
  const offsets = new Map();
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

function findCatalogObjectNumber(source, objectOffsets) {
  for (const objectNumber of objectOffsets.keys()) {
    if (/\/Type\s*\/Catalog\b/.test(readObjectBody(source, objectNumber))) {
      return objectNumber;
    }
  }

  return null;
}

function readObjectBody(source, objectNumber) {
  const objectPattern = new RegExp(`\\b${objectNumber}\\s+\\d+\\s+obj\\b`);
  const objectStart = source.search(objectPattern);

  if (objectStart === -1) {
    return '';
  }

  const endIndex = source.indexOf('endobj', objectStart);
  return endIndex === -1 ? source.slice(objectStart) : source.slice(objectStart, endIndex);
}

function appendRebuiltXref(originalBytes, objectOffsets, rootObjectNumber) {
  const sourceText = bytesToBinaryString(originalBytes);
  const bodyText = stripTrailingRepairSections(sourceText).trimEnd();
  const xrefStart = bodyText.length + 1;
  const maxObjectNumber = Math.max(...objectOffsets.keys());
  const xrefText = createXrefSection(objectOffsets, maxObjectNumber, rootObjectNumber, xrefStart);

  return binaryStringToBytes(`${bodyText}\n${xrefText}`);
}

function stripTrailingRepairSections(source) {
  const lastEndObject = source.lastIndexOf('endobj');
  return lastEndObject === -1 ? source : source.slice(0, lastEndObject + 'endobj'.length);
}

function createXrefSection(objectOffsets, maxObjectNumber, rootObjectNumber, xrefStart) {
  const rows = ['xref', `0 ${maxObjectNumber + 1}`, '0000000000 65535 f '];

  for (let objectNumber = 1; objectNumber <= maxObjectNumber; objectNumber += 1) {
    const offset = objectOffsets.get(objectNumber);
    rows.push(offset === undefined ? '0000000000 65535 f ' : `${String(offset).padStart(10, '0')} 00000 n `);
  }

  rows.push('trailer', `<< /Size ${maxObjectNumber + 1} /Root ${rootObjectNumber} 0 R >>`);
  rows.push('startxref', String(xrefStart), '%%EOF');
  return `${rows.join('\n')}\n`;
}

function formatPageNumber(format, pageNumber, totalPages) {
  const template = format.trim() || '{n}';
  return template.split('{n}').join(String(pageNumber)).split('{total}').join(String(totalPages));
}

function getStandardFont(font) {
  if (font === 'times-roman') return PDFLib.StandardFonts.TimesRoman;
  if (font === 'courier') return PDFLib.StandardFonts.Courier;
  return PDFLib.StandardFonts.Helvetica;
}

function calculatePageNumberPosition(pageSize, text, font, options) {
  const textWidth = font.widthOfTextAtSize(text, options.size);
  const textHeight = font.heightAtSize(options.size);
  const x = getHorizontalPosition(options.position, pageSize.width, textWidth, options.margin);
  const y = options.position.startsWith('top')
    ? pageSize.height - options.margin - textHeight
    : options.margin;

  return { x, y };
}

function drawCenteredTextWatermark(page, options, font, color) {
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

async function embedWatermarkImage(pdf, options) {
  if (options.imageMimeType === 'image/png') return pdf.embedPng(options.imageData);
  if (options.imageMimeType === 'image/jpeg') return pdf.embedJpg(options.imageData);
  throw new Error('Watermark image must be a PNG or JPG file.');
}

function drawCenteredImageWatermark(page, options, image) {
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

function drawEditAnnotation(page, annotation, font) {
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

function applyFormFieldValue(field, value) {
  if (field instanceof PDFLib.PDFTextField) {
    field.setText(String(value ?? ''));
    return;
  }

  if (field instanceof PDFLib.PDFCheckBox) {
    Boolean(value) ? field.check() : field.uncheck();
    return;
  }

  applyChoiceFieldValue(field, value);
}

function applyChoiceFieldValue(field, value) {
  if (field instanceof PDFLib.PDFDropdown || field instanceof PDFLib.PDFOptionList) {
    const values = Array.isArray(value) ? value : [String(value ?? '')];
    values.length === 0 || values.every((entry) => entry.length === 0) ? field.clear() : field.select(values);
    return;
  }

  if (field instanceof PDFLib.PDFRadioGroup) {
    const selection = String(Array.isArray(value) ? value[0] ?? '' : value ?? '');
    selection.length === 0 ? field.clear() : field.select(selection);
    return;
  }

  throw new Error('Unsupported PDF form field type.');
}

function drawTextAnnotation(page, annotation, font) {
  const { width, height } = page.getSize();
  const point = mapViewportPoint(annotation, { width, height }, { x: annotation.x, y: annotation.y });
  const fontSize = scaleViewportLength(annotation.size, annotation.viewportHeight, height);

  page.drawText(annotation.text, {
    x: point.x,
    y: point.y - fontSize,
    size: fontSize,
    font,
    color: parseHexColor(annotation.color),
    opacity: annotation.opacity,
  });
}

function drawRectangleAnnotation(page, annotation) {
  const { width, height } = page.getSize();
  const topLeft = mapViewportPoint(annotation, { width, height }, { x: annotation.x, y: annotation.y });
  const rectWidth = scaleViewportLength(annotation.width, annotation.viewportWidth, width);
  const rectHeight = scaleViewportLength(annotation.height, annotation.viewportHeight, height);

  page.drawRectangle({ x: topLeft.x, y: topLeft.y - rectHeight, width: rectWidth, height: rectHeight, borderColor: parseHexColor(annotation.color), borderWidth: annotation.borderWidth, opacity: annotation.opacity });
}

function drawInkAnnotation(page, annotation) {
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
    opacity: annotation.opacity,
  });
}

function mapViewportPoint(annotation, pageSize, point) {
  return {
    x: scaleViewportLength(point.x, annotation.viewportWidth, pageSize.width),
    y: pageSize.height - scaleViewportLength(point.y, annotation.viewportHeight, pageSize.height),
  };
}

function scaleViewportLength(value, viewportLength, pageLength) {
  return (value / viewportLength) * pageLength;
}

function formatPathNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function getHorizontalPosition(position, pageWidth, textWidth, margin) {
  if (position.endsWith('center')) {
    return (pageWidth - textWidth) / 2;
  }

  return position.endsWith('right') ? pageWidth - margin - textWidth : margin;
}

function parseHexColor(color) {
  const match = color.trim().match(/^#?([0-9a-f]{6})$/i);

  if (!match) {
    throw new Error('Page number color must be a 6-digit hex color.');
  }

  const value = Number.parseInt(match[1], 16);
  return PDFLib.rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

function createPageIndexes(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start - 1 + index);
}

function normalizeRotation(rotation) {
  return ((rotation % 360) + 360) % 360;
}

function bytesToBinaryString(bytes) {
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
}

function binaryStringToBytes(value) {
  const bytes = new Uint8Array(value.length);

  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }

  return bytes;
}

function toExactArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
