self.onmessage = async (event) => {
  const { jobId, type, payload } = event.data ?? {};

  try {
    if (!jobId || typeof type !== 'string') {
      throw new Error('Invalid OCR worker message.');
    }

    if (type === 'ping') {
      self.postMessage({ jobId, status: 'success', result: { worker: 'ocr', ready: true } });
      return;
    }

    if (type === 'echo-buffers') {
      const buffers = Array.isArray(payload?.buffers) ? payload.buffers : [];
      const totalBytes = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);

      self.postMessage({
        jobId,
        status: 'success',
        result: {
          worker: 'ocr',
          receivedBuffers: buffers.length,
          totalBytes,
        },
      });
      return;
    }

    throw new Error(`Unsupported OCR worker job: ${type}`);
  } catch (error) {
    self.postMessage({
      jobId: jobId ?? 'unknown',
      status: 'error',
      error: error instanceof Error ? error.message : 'OCR worker failed.',
    });
  }
};
