type QpdfFs = {
  writeFile: (path: string, data: Uint8Array) => void;
  readFile: (path: string) => Uint8Array;
  unlink: (path: string) => void;
};

type QpdfModule = {
  FS: QpdfFs;
  callMain: (args: string[]) => void;
};

type QpdfFactory = (options: Record<string, unknown>) => Promise<QpdfModule>;

export async function protectPdfWithPassword(file: ArrayBuffer, password: string): Promise<ArrayBuffer> {
  assertPassword(password, 'Protect password is required.');
  return runQpdf(
    file,
    (inputPath, outputPath) => ['--encrypt', password, password, '256', '--', inputPath, outputPath],
    'Unable to protect this PDF with the provided password.',
  );
}

export async function unlockPdfWithPassword(file: ArrayBuffer, password: string): Promise<ArrayBuffer> {
  assertPassword(password, 'Unlock password is required.');
  return runQpdf(
    file,
    (inputPath, outputPath) => [`--password=${password}`, '--decrypt', inputPath, outputPath],
    'Unable to unlock this PDF. Check the password and try again.',
  );
}

async function runQpdf(
  file: ArrayBuffer,
  createArgs: (inputPath: string, outputPath: string) => string[],
  failureMessage: string,
): Promise<ArrayBuffer> {
  const qpdf = await createQpdfModule();
  const inputPath = `/input-${createId()}.pdf`;
  const outputPath = `/output-${createId()}.pdf`;

  try {
    qpdf.FS.writeFile(inputPath, new Uint8Array(file.slice(0)));
    qpdf.callMain(createArgs(inputPath, outputPath));
    const output = qpdf.FS.readFile(outputPath);
    return toExactArrayBuffer(output);
  } catch (error) {
    const detail = error instanceof Error && error.message ? ` ${error.message}` : '';
    throw new Error(`${failureMessage}${detail}`);
  } finally {
    unlinkIfPresent(qpdf.FS, inputPath);
    unlinkIfPresent(qpdf.FS, outputPath);
  }
}

async function createQpdfModule(): Promise<QpdfModule> {
  const module = await import('qpdf-wasm-esm-embedded');
  const createModule = module.default as unknown as QpdfFactory;
  const stderr: string[] = [];

  return createModule({
    noInitialRun: true,
    print: () => undefined,
    printErr: (message: string) => {
      stderr.push(message);
    },
  });
}

function assertPassword(password: string, message: string): void {
  if (password.length === 0) {
    throw new Error(message);
  }
}

function unlinkIfPresent(fs: QpdfFs, path: string): void {
  try {
    fs.unlink(path);
  } catch {
    // QPDF may fail before creating the output file.
  }
}

function createId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toExactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}
