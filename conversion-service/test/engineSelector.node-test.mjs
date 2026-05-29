import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { selectEngine, targetExtension } from '../src/engineSelector.mjs';

describe('engine selector', () => {
  it('routes office and HTML conversions to high-fidelity engines', () => {
    assert.equal(selectEngine({ tool: 'wordToPdf', mode: 'high-fidelity' }), 'libreoffice');
    assert.equal(selectEngine({ tool: 'powerPointToPdf', mode: 'high-fidelity' }), 'libreoffice');
    assert.equal(selectEngine({ tool: 'excelToPdf', mode: 'high-fidelity' }), 'libreoffice');
    assert.equal(selectEngine({ tool: 'htmlToPdf', mode: 'high-fidelity' }), 'chromium');
  });

  it('routes PDF exports to document understanding or raster engines', () => {
    assert.equal(selectEngine({ tool: 'pdfToWord', mode: 'editable' }), 'docling');
    assert.equal(selectEngine({ tool: 'pdfToExcel', mode: 'editable' }), 'docling');
    assert.equal(selectEngine({ tool: 'pdfToPowerPoint', mode: 'high-fidelity' }), 'docling');
    assert.equal(selectEngine({ tool: 'pdfToJpg', mode: 'high-fidelity' }), 'pdfium');
  });

  it('maps target MIME types to output extensions', () => {
    assert.equal(targetExtension('application/pdf'), 'pdf');
    assert.equal(targetExtension('application/zip'), 'zip');
    assert.equal(targetExtension('application/vnd.openxmlformats-officedocument.wordprocessingml.document'), 'docx');
  });
});
