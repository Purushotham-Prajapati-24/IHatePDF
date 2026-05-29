import assert from 'node:assert/strict';

const serviceUrl = (process.env.CONVERSION_SERVICE_URL || 'http://127.0.0.1:8787').replace(/\/+$/, '');

async function main() {
  const health = await fetch(`${serviceUrl}/health`);
  assert.equal(health.status, 200, 'health endpoint must return 200');
  const healthBody = await health.json();
  assert.equal(healthBody.ok, true, 'service must be healthy');

  for (const engine of ['libreoffice', 'chromium', 'docling', 'pdfRasterizer', 'zip']) {
    assert.equal(healthBody.engines?.[engine]?.ok, true, `${engine} must be ready`);
  }

  const html = `<!doctype html>
    <html>
      <head>
        <style>
          @page { size: A4; margin: 24mm; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 2px solid #111; padding: 8px; }
        </style>
      </head>
      <body>
        <h1>IHatePDF verification</h1>
        <table><tr><th>Metric</th><th>Value</th></tr><tr><td>Total</td><td>42</td></tr></table>
      </body>
    </html>`;

  const body = new FormData();
  body.append('file', new Blob([html], { type: 'text/html' }), 'verification.html');
  body.append('metadata', JSON.stringify({
    tool: 'htmlToPdf',
    mode: 'high-fidelity',
    fileName: 'verification.html',
    sourceMimeType: 'text/html',
    targetMimeType: 'application/pdf',
    options: {},
  }));

  const response = await fetch(`${serviceUrl}/convert`, { method: 'POST', body });
  const output = Buffer.from(await response.arrayBuffer());

  assert.equal(response.status, 200, output.toString('utf8'));
  assert.equal(response.headers.get('x-conversion-engine'), 'chromium');
  assert.equal(response.headers.get('x-conversion-fallback-used'), 'false');
  assert.match(response.headers.get('x-conversion-filename') || '', /verification-converted\.pdf/);
  assert.ok(Number(response.headers.get('x-conversion-duration-ms')) >= 0);
  assert.equal(output.subarray(0, 5).toString('ascii'), '%PDF-');
  assert.ok(output.byteLength > 1000, 'PDF output should not be blank');

  const wordBody = new FormData();
  wordBody.append('file', new Blob([output], { type: 'application/pdf' }), 'verification.pdf');
  wordBody.append('metadata', JSON.stringify({
    tool: 'pdfToWord',
    mode: 'editable',
    fileName: 'verification.pdf',
    sourceMimeType: 'application/pdf',
    targetMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    options: {},
  }));

  const wordResponse = await fetch(`${serviceUrl}/convert`, { method: 'POST', body: wordBody });
  const wordOutput = Buffer.from(await wordResponse.arrayBuffer());

  assert.equal(wordResponse.status, 200, wordOutput.toString('utf8'));
  assert.equal(wordResponse.headers.get('x-conversion-engine'), 'docling');
  assert.equal(wordResponse.headers.get('x-conversion-fallback-used'), 'false');
  assert.match(wordResponse.headers.get('x-conversion-filename') || '', /verification-converted\.docx/);
  assert.equal(wordOutput.subarray(0, 2).toString('ascii'), 'PK');
  assert.ok(wordOutput.byteLength > 1000, 'DOCX output should not be blank');

  console.log('Docker verification passed: health engines ready, HTML converted to PDF, and PDF converted to DOCX without fallback.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
