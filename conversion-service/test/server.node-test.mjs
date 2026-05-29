import { createServer } from 'node:http';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequestHandler } from '../src/server.mjs';

describe('conversion service HTTP boundary', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = createServer(createRequestHandler({
      runEngineImpl: async (engine, inputPath, metadata, jobDir) => {
        assert.equal(engine, 'chromium');
        assert.ok(inputPath.endsWith('.html'));
        const outputPath = join(jobDir, 'output.pdf');
        await writeFile(outputPath, Buffer.from('%PDF-test'));
        return {
          path: outputPath,
          fileName: `${metadata.fileName.replace(/\.[^.]+$/, '')}-converted.pdf`,
          mimeType: 'application/pdf',
          warnings: ['mock warning'],
        };
      },
    }));

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it('reports health', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.ok(body.engines);
  });

  it('converts multipart uploads and exposes engine metadata headers', async () => {
    const body = new FormData();
    body.append('file', new Blob(['<h1>Invoice</h1>'], { type: 'text/html' }), 'invoice.html');
    body.append('metadata', JSON.stringify({
      tool: 'htmlToPdf',
      mode: 'high-fidelity',
      fileName: 'invoice.html',
      sourceMimeType: 'text/html',
      targetMimeType: 'application/pdf',
      options: {},
    }));

    const response = await fetch(`${baseUrl}/convert`, {
      method: 'POST',
      body,
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-conversion-engine'), 'chromium');
    assert.equal(response.headers.get('x-conversion-filename'), 'invoice-converted.pdf');
    assert.match(response.headers.get('access-control-expose-headers'), /x-conversion-engine/);
    assert.match(response.headers.get('access-control-expose-headers'), /x-conversion-duration-ms/);
    assert.equal(response.headers.get('x-conversion-fallback-used'), 'false');
    assert.equal(await response.text(), '%PDF-test');
  });

  it('rejects non-multipart conversion requests', async () => {
    const response = await fetch(`${baseUrl}/convert`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });

    assert.equal(response.status, 415);
    assert.match(await response.text(), /multipart\/form-data/);
  });
});
