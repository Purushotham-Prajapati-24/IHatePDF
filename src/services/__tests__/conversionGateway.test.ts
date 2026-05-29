import { afterEach, describe, expect, it, vi } from 'vitest';
import { convertWithGateway, getEngineLabel, getPreferredEngine } from '../conversionGateway';

describe('conversionGateway', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('selects dedicated engines for high-fidelity conversions', () => {
    expect(getPreferredEngine('wordToPdf', 'high-fidelity')).toBe('libreoffice');
    expect(getPreferredEngine('htmlToPdf', 'high-fidelity')).toBe('chromium');
    expect(getPreferredEngine('pdfToJpg', 'high-fidelity')).toBe('pdfium');
    expect(getPreferredEngine('pdfToWord', 'editable')).toBe('docling');
    expect(getPreferredEngine('merge', 'high-fidelity')).toBe('browser');
  });

  it('fails high-fidelity conversion instead of falling back when the service is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('service offline')));

    await expect(convertWithGateway({
      sourceMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      targetMimeType: 'application/pdf',
      mode: 'high-fidelity',
      fileName: 'brief.docx',
      file: new Blob([new Uint8Array([1])]),
      options: {},
      tool: 'wordToPdf',
    }, async () => ({
      buffer: new Uint8Array([37, 80, 68, 70]).buffer,
      fileName: 'brief-converted.pdf',
      mimeType: 'application/pdf',
    }))).rejects.toThrow(/VITE_CONVERSION_SERVICE_URL|service offline/);
  });

  it('uses browser conversion only when local-only is selected', async () => {
    const result = await convertWithGateway({
      sourceMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      targetMimeType: 'application/pdf',
      mode: 'local-only',
      fileName: 'brief.docx',
      file: new Blob([new Uint8Array([1])]),
      options: {},
      tool: 'wordToPdf',
    }, async () => ({
      buffer: new Uint8Array([37, 80, 68, 70]).buffer,
      fileName: 'brief-converted.pdf',
      mimeType: 'application/pdf',
    }));

    expect(result.engine).toBe('browser');
    expect(result.fallbackUsed).toBe(true);
    expect(result.warnings.join(' ')).toContain('Local-only conversion');
    expect(getEngineLabel('libreoffice')).toContain('LibreOffice');
  });
});
