const PDFJS_MODULE_URL = '/assets/pdf.min.mjs';
const PDFJS_WORKER_SRC = '/assets/pdf.worker.min.mjs';
const OUTPUT_MIME_TYPE = 'image/png';

let pdfjsModulePromise;

self.onmessage = async (event) => {
  const { jobId, type, payload } = event.data ?? {};

  try {
    if (!jobId || type !== 'generate-previews') {
      throw new Error('Invalid preview worker message.');
    }

    const previews = await generatePreviews(payload?.data, payload?.width);
    self.postMessage({ jobId, status: 'success', result: previews });
  } catch (error) {
    self.postMessage({
      jobId: jobId ?? 'unknown',
      status: 'error',
      error: error instanceof Error ? error.message : 'Preview worker failed.',
    });
  }
};

async function generatePreviews(data, width) {
  if (!(data instanceof ArrayBuffer)) {
    throw new Error('Expected preview data to be an ArrayBuffer.');
  }

  if (typeof OffscreenCanvas === 'undefined') {
    throw new Error('OffscreenCanvas is unavailable.');
  }

  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({
    data,
    verbosity: pdfjs.VerbosityLevel.ERRORS,
  }).promise;
  const previews = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      previews.push(await renderPreview(pdf, pageNumber, width));
    }

    return previews;
  } finally {
    await pdf.destroy();
  }
}

async function renderPreview(pdf, pageNumber, targetWidth = 240) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const scale = targetWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale });
  const canvas = new OffscreenCanvas(
    Math.ceil(scaledViewport.width),
    Math.ceil(scaledViewport.height),
  );
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Preview worker canvas context is unavailable.');
  }

  await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
  page.cleanup();

  const blob = await canvas.convertToBlob({ type: OUTPUT_MIME_TYPE });
  return {
    url: new FileReaderSync().readAsDataURL(blob),
    width: viewport.width,
    height: viewport.height,
  };
}

async function loadPdfJs() {
  pdfjsModulePromise ??= import(PDFJS_MODULE_URL).then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
    return pdfjs;
  });

  return pdfjsModulePromise;
}
