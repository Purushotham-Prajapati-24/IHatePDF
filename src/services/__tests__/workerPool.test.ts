import { describe, expect, it } from 'vitest';
import { WorkerPool, type WorkerKind, type WorkerRoundTripResult } from '../workerPool';

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  isTerminated = false;

  postMessage(message: unknown) {
    const request = message as { jobId: string; type: string; payload?: { buffers?: ArrayBuffer[] } };

    queueMicrotask(() => {
      if (request.type === 'fail') {
        this.onmessage?.(
          new MessageEvent('message', {
            data: { jobId: request.jobId, status: 'error', error: 'Worker rejected job.' },
          }),
        );
        return;
      }

      const buffers = request.payload?.buffers ?? [];
      this.onmessage?.(
        new MessageEvent('message', {
          data: {
            jobId: request.jobId,
            status: 'success',
            result: {
              worker: 'pdf',
              receivedBuffers: buffers.length,
              totalBytes: buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0),
            },
          },
        }),
      );
    });
  }

  terminate() {
    this.isTerminated = true;
  }
}

describe('WorkerPool', () => {
  it('resolves a worker job by job id', async () => {
    const pool = new WorkerPool(() => new FakeWorker());
    const buffers = [new Uint8Array([1, 2]).buffer, new Uint8Array([3]).buffer];

    const result = await pool.runJob<{ buffers: ArrayBuffer[] }, WorkerRoundTripResult>(
      'pdf',
      'echo-buffers',
      { buffers },
      buffers,
    );

    expect(result).toEqual({
      worker: 'pdf',
      receivedBuffers: 2,
      totalBytes: 3,
    });
  });

  it('rejects failed worker jobs with the worker error', async () => {
    const pool = new WorkerPool((_kind: WorkerKind) => new FakeWorker());

    await expect(pool.runJob('ocr', 'fail', {})).rejects.toThrow('Worker rejected job.');
  });
});
