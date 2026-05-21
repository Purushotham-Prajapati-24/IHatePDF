export type WorkerKind = 'pdf' | 'ocr';

export interface WorkerRoundTripResult {
  worker: WorkerKind;
  receivedBuffers: number;
  totalBytes: number;
}

interface WorkerRequest<Payload> {
  jobId: string;
  type: string;
  payload: Payload;
}

interface WorkerResponse<Result> {
  jobId: string;
  status: 'success' | 'error';
  result?: Result;
  error?: string;
}

interface WorkerLike {
  onmessage: ((event: MessageEvent<WorkerResponse<unknown>>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: unknown, transfer: Transferable[]): void;
  terminate(): void;
}

type WorkerFactory = (kind: WorkerKind) => WorkerLike;

const WORKER_URLS: Record<WorkerKind, string> = {
  pdf: '/workers/pdf.worker.js',
  ocr: '/workers/ocr.worker.js',
};

const JOB_TIMEOUT_MS = 120_000;

class WorkerJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkerJobError';
  }
}

export class WorkerPool {
  private readonly workers = new Map<WorkerKind, WorkerLike>();
  private readonly pendingJobs = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (reason: Error) => void;
      timeoutId: ReturnType<typeof setTimeout>;
    }
  >();

  constructor(private readonly createWorker: WorkerFactory = createBrowserWorker) {}

  runJob<Payload, Result>(
    kind: WorkerKind,
    type: string,
    payload: Payload,
    transfer: Transferable[] = [],
  ): Promise<Result> {
    const worker = this.getWorker(kind);
    const jobId = crypto.randomUUID();
    const message: WorkerRequest<Payload> = { jobId, type, payload };

    return new Promise<Result>((resolve, reject) => {
      const timeoutId = globalThis.setTimeout(() => {
        this.pendingJobs.delete(jobId);
        reject(new WorkerJobError(`Worker job timed out: ${type}`));
      }, JOB_TIMEOUT_MS);

      this.pendingJobs.set(jobId, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeoutId,
      });
      worker.postMessage(message, transfer);
    });
  }

  terminateAll() {
    for (const worker of this.workers.values()) {
      worker.terminate();
    }

    this.workers.clear();
    this.rejectPendingJobs(new WorkerJobError('Worker pool was terminated.'));
  }

  private getWorker(kind: WorkerKind): WorkerLike {
    const existingWorker = this.workers.get(kind);

    if (existingWorker) {
      return existingWorker;
    }

    const worker = this.createWorker(kind);
    worker.onmessage = (event) => this.handleMessage(event.data);
    worker.onerror = (event) => {
      this.rejectPendingJobs(new WorkerJobError(event.message || `${kind} worker failed.`));
    };
    this.workers.set(kind, worker);
    return worker;
  }

  private handleMessage<Result>(message: WorkerResponse<Result>) {
    const pendingJob = this.pendingJobs.get(message.jobId);

    if (!pendingJob) {
      return;
    }

    globalThis.clearTimeout(pendingJob.timeoutId);
    this.pendingJobs.delete(message.jobId);

    if (message.status === 'error') {
      pendingJob.reject(new WorkerJobError(message.error ?? 'Worker job failed.'));
      return;
    }

    pendingJob.resolve(message.result);
  }

  private rejectPendingJobs(error: Error) {
    for (const [jobId, pendingJob] of this.pendingJobs.entries()) {
      globalThis.clearTimeout(pendingJob.timeoutId);
      pendingJob.reject(error);
      this.pendingJobs.delete(jobId);
    }
  }
}

function createBrowserWorker(kind: WorkerKind): WorkerLike {
  return new Worker(WORKER_URLS[kind]);
}

export const workerPool = new WorkerPool();

export async function runPdfBufferRoundTrip(buffers: ArrayBuffer[]): Promise<WorkerRoundTripResult> {
  return workerPool.runJob('pdf', 'echo-buffers', { buffers }, buffers);
}
