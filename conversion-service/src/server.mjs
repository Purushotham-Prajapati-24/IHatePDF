import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { spawn } from 'node:child_process';
import Busboy from 'busboy';
import { selectEngine, targetExtension } from './engineSelector.mjs';

const PORT = Number(process.env.PORT || 8787);
const JOB_TIMEOUT_MS = Number(process.env.JOB_TIMEOUT_MS || 120000);
const MAX_FILE_BYTES = Number(process.env.MAX_FILE_BYTES || 100 * 1024 * 1024);
const MAX_PDF_PAGES = Number(process.env.MAX_PDF_PAGES || 500);
const ENGINE_TIMEOUT_MS = {
  libreoffice: Number(process.env.LIBREOFFICE_TIMEOUT_MS || JOB_TIMEOUT_MS),
  chromium: Number(process.env.CHROMIUM_TIMEOUT_MS || JOB_TIMEOUT_MS),
  docling: Number(process.env.DOCLING_TIMEOUT_MS || JOB_TIMEOUT_MS),
  pdfium: Number(process.env.PDF_RASTERIZER_TIMEOUT_MS || JOB_TIMEOUT_MS),
};

export function createRequestHandler({ runEngineImpl = runEngine } = {}) {
  return async (request, response) => {
    if (request.method === 'OPTIONS') {
      sendEmpty(response, 204);
      return;
    }

    if (request.method === 'GET' && request.url === '/health') {
      sendJson(response, 200, { ok: true, engines: await checkReadiness() });
      return;
    }

    if (request.method === 'POST' && request.url === '/convert') {
      await handleConvert(request, response, runEngineImpl);
      return;
    }

    sendJson(response, 404, { error: 'Not found' });
  };
}

export function startServer(port = PORT) {
  return createServer(createRequestHandler()).listen(port, () => {
    console.log(`IHatePDF conversion service listening on ${port}`);
  });
}

async function handleConvert(request, response, runEngineImpl) {
  const jobDir = await mkdtemp(join(tmpdir(), 'ihatepdf-'));

  try {
    const upload = await readMultipartUpload(request, jobDir);
    const metadata = JSON.parse(upload.metadata || '{}');
    validateMetadata(metadata);
    const engine = selectEngine(metadata);
    validateLimits(metadata);
    const startedAt = Date.now();
    const output = await runEngineImpl(engine, upload.filePath, metadata, jobDir);
    const bytes = await readFile(output.path);
    const durationMs = Date.now() - startedAt;

    response.writeHead(200, createHeaders({
      'content-type': metadata.targetMimeType || output.mimeType || 'application/octet-stream',
      'content-length': bytes.byteLength,
      'x-conversion-engine': engine,
      'x-conversion-filename': output.fileName,
      'x-conversion-warnings': JSON.stringify(output.warnings || []),
      'x-conversion-duration-ms': String(durationMs),
      'x-conversion-fallback-used': 'false',
      ...(output.pageCount ? { 'x-conversion-page-count': String(output.pageCount) } : {}),
    }));
    response.end(bytes);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    sendJson(response, statusCode, { error: error.message || 'Conversion failed' });
  } finally {
    await rm(jobDir, { recursive: true, force: true });
  }
}

async function readMultipartUpload(request, jobDir) {
  const contentType = request.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    throw Object.assign(new Error('Expected multipart/form-data upload.'), { statusCode: 415 });
  }

  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: request.headers,
      limits: {
        files: 1,
        fileSize: MAX_FILE_BYTES,
        fields: 1,
      },
    });

    let metadata = '';
    let filePath = null;
    let originalName = 'document';
    let rejected = false;
    const writes = [];

    busboy.on('field', (name, value) => {
      if (name === 'metadata') metadata = value;
    });

    busboy.on('file', (name, file, info) => {
      if (name !== 'file') {
        file.resume();
        return;
      }

      originalName = basename(info.filename || originalName);
      filePath = join(jobDir, `input${extname(originalName) || '.bin'}`);
      file.on('limit', () => {
        rejected = true;
        reject(Object.assign(new Error(`Upload exceeds ${MAX_FILE_BYTES} byte limit.`), { statusCode: 413 }));
      });
      writes.push(pipeline(file, createWriteStream(filePath)));
    });

    busboy.on('error', reject);
    busboy.on('finish', async () => {
      try {
        if (rejected) return;
        await Promise.all(writes);
        if (!filePath) throw Object.assign(new Error('Missing upload file.'), { statusCode: 400 });
        resolve({ filePath, originalName, metadata });
      } catch (error) {
        reject(error);
      }
    });

    request.pipe(busboy);
  });
}

export async function runEngine(engine, inputPath, metadata, jobDir) {
  switch (engine) {
    case 'libreoffice':
      return runLibreOffice(inputPath, metadata, jobDir);
    case 'chromium':
      return runChromium(inputPath, metadata, jobDir);
    case 'docling':
      return runDocling(inputPath, metadata, jobDir);
    case 'pdfium':
      return runPdfium(inputPath, metadata, jobDir);
    default:
      throw Object.assign(new Error(`Engine is not available server-side: ${engine}`), { statusCode: 400 });
  }
}

async function runLibreOffice(inputPath, metadata, jobDir) {
  const outDir = join(jobDir, 'office-out');
  await mkdir(outDir, { recursive: true });
  await runCommand('libreoffice', [
    '--headless',
    '--nologo',
    '--nofirststartwizard',
    '--convert-to',
    'pdf',
    '--outdir',
    outDir,
    inputPath,
  ], ENGINE_TIMEOUT_MS.libreoffice);

  const path = join(outDir, `${basename(inputPath, extname(inputPath))}.pdf`);
  return {
    path,
    fileName: convertedName(metadata, 'pdf'),
    mimeType: 'application/pdf',
    warnings: ['Missing fonts or protected embedded objects may alter layout.'],
  };
}

async function runChromium(inputPath, metadata, jobDir) {
  const outputPath = join(jobDir, 'output.pdf');
  await runCommand(process.env.CHROMIUM_BIN || 'chromium', [
    '--headless=new',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--allow-file-access-from-files',
    '--host-resolver-rules=MAP * 0.0.0.0,EXCLUDE localhost',
    `--print-to-pdf=${outputPath}`,
    `file://${inputPath}`,
  ], ENGINE_TIMEOUT_MS.chromium);

  return {
    path: outputPath,
    fileName: convertedName(metadata, 'pdf'),
    mimeType: 'application/pdf',
    warnings: ['Network fetches are blocked by deployment policy unless explicitly enabled.'],
  };
}

async function runDocling(inputPath, metadata, jobDir) {
  if (metadata.tool === 'pdfToWord') {
    return runDoclingToWord(inputPath, metadata, jobDir);
  }

  const extension = targetExtension(metadata.targetMimeType || '');
  if (!['html', 'md', 'json', 'yaml', 'text'].includes(extension)) {
    throw Object.assign(new Error(`Docling cannot export ${extension}. Use PDF to Word high-fidelity mode or Local-only for this format.`), { statusCode: 400 });
  }

  const outputPath = join(jobDir, `output.${extension}`);
  await runCommand(process.env.DOCLING_BIN || 'docling', [inputPath, '--to', extension, '--output', outputPath], ENGINE_TIMEOUT_MS.docling);

  return {
    path: outputPath,
    fileName: convertedName(metadata, extension),
    mimeType: metadata.targetMimeType,
    warnings: ['Editable export confidence depends on PDF structure and OCR quality.'],
  };
}

async function runDoclingToWord(inputPath, metadata, jobDir) {
  const doclingOutDir = join(jobDir, 'docling-text');
  const outputPath = join(jobDir, 'output.docx');
  await mkdir(doclingOutDir, { recursive: true });

  await runCommand(process.env.DOCLING_BIN || 'docling', [
    inputPath,
    '--to',
    'text',
    '--no-ocr',
    '--output',
    doclingOutDir,
  ], ENGINE_TIMEOUT_MS.docling);

  const textPath = await findFirstFile(doclingOutDir, '.txt');
  if (!textPath) {
    throw Object.assign(new Error('Docling did not produce a text intermediate for Word export.'), { statusCode: 502 });
  }

  const text = await readFile(textPath, 'utf8');
  await writeFile(outputPath, await createDocxFromText(text, metadata));

  return {
    path: outputPath,
    fileName: convertedName(metadata, 'docx'),
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    warnings: ['Editable export was reconstructed from Docling text; verify tables, headers, images, and complex positioning.'],
  };
}

async function createDocxFromText(text, metadata) {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');
  const paragraphs = text
    .split(/\n{2,}/g)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const document = new Document({
    creator: 'IHatePDF Conversion Service',
    title: metadata.fileName || 'Converted PDF',
    sections: [{
      children: (paragraphs.length > 0 ? paragraphs : ['No readable text was found in this PDF.'])
        .map((paragraph) => new Paragraph({
          children: [new TextRun({ text: paragraph })],
          spacing: { after: 180 },
        })),
    }],
  });

  return Packer.toBuffer(document);
}

async function runPdfium(inputPath, metadata, jobDir) {
  const outputPath = join(jobDir, 'pages.zip');
  const pagesPrefix = join(jobDir, 'page');
  await runCommand(process.env.PDF_RASTERIZER_BIN || 'pdftoppm', [
    '-jpeg',
    '-r',
    String(metadata.options?.dpi || 150),
    inputPath,
    pagesPrefix,
  ], ENGINE_TIMEOUT_MS.pdfium);
  await runCommand('zip', ['-j', outputPath, ...await listGeneratedJpegs(jobDir)], ENGINE_TIMEOUT_MS.pdfium);

  return {
    path: outputPath,
    fileName: convertedName(metadata, 'zip'),
    mimeType: 'application/zip',
    warnings: [],
  };
}

async function runCommand(command, args, timeoutMs = JOB_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        signal: controller.signal,
        env: {
          ...process.env,
          HOME: tmpdir(),
        },
      });
      let stderr = '';
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
      child.on('error', reject);
      child.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${command} exited with ${code}: ${stderr.slice(0, 1000)}`));
      });
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw Object.assign(new Error(`${command} timed out after ${timeoutMs}ms`), { statusCode: 504 });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function listGeneratedJpegs(jobDir) {
  return (await readdir(jobDir))
    .filter((name) => /^page-\d+\.jpg$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => join(jobDir, name));
}

async function findFirstFile(rootDir, extension) {
  const matches = [];

  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const entryPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(extension)) {
        matches.push(entryPath);
      }
    }
  }

  await visit(rootDir);
  return matches.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0] ?? null;
}

function validateMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    throw Object.assign(new Error('Missing conversion metadata.'), { statusCode: 400 });
  }

  if (typeof metadata.tool !== 'string' || typeof metadata.mode !== 'string') {
    throw Object.assign(new Error('Conversion metadata must include tool and mode.'), { statusCode: 400 });
  }

  if (typeof metadata.targetMimeType !== 'string' || metadata.targetMimeType.length === 0) {
    throw Object.assign(new Error('Conversion metadata must include targetMimeType.'), { statusCode: 400 });
  }
}

function validateLimits(metadata) {
  const pageCount = Number(metadata.options?.pageCount || 0);
  if (Number.isFinite(pageCount) && pageCount > MAX_PDF_PAGES) {
    throw Object.assign(new Error(`Input exceeds ${MAX_PDF_PAGES} page limit.`), { statusCode: 413 });
  }
}

export async function checkReadiness() {
  const checks = await Promise.all([
    commandReady('libreoffice', ['--version']),
    commandReady(process.env.CHROMIUM_BIN || 'chromium', ['--version']),
    commandReady(process.env.DOCLING_BIN || 'docling', ['--version']),
    commandReady(process.env.PDF_RASTERIZER_BIN || 'pdftoppm', ['-v']),
    commandReady('zip', ['-v']),
  ]);

  return {
    libreoffice: checks[0],
    chromium: checks[1],
    docling: checks[2],
    pdfRasterizer: checks[3],
    zip: checks[4],
  };
}

async function commandReady(command, args) {
  try {
    await runCommand(command, args, 5000);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'readiness check failed' };
  }
}

function convertedName(metadata, extension) {
  const sourceName = metadata.fileName || 'document';
  const baseName = basename(sourceName, extname(sourceName)) || 'document';
  return `${baseName}-converted.${extension}`;
}

function sendJson(response, statusCode, body) {
  const bytes = Buffer.from(JSON.stringify(body));
  response.writeHead(statusCode, createHeaders({
    'content-type': 'application/json',
    'content-length': bytes.byteLength,
  }));
  response.end(bytes);
}

function sendEmpty(response, statusCode) {
  response.writeHead(statusCode, createHeaders({ 'content-length': 0 }));
  response.end();
}

function createHeaders(headers) {
  return {
    'access-control-allow-origin': process.env.ALLOWED_ORIGIN || '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-expose-headers': 'x-conversion-engine,x-conversion-filename,x-conversion-warnings,x-conversion-duration-ms,x-conversion-fallback-used,x-conversion-page-count',
    ...headers,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
