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

function createPageIndexes(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start - 1 + index);
}

function normalizeRotation(rotation) {
  return ((rotation % 360) + 360) % 360;
}

function toExactArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
