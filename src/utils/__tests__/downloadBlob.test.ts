import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob } from '../downloadBlob';

describe('downloadBlob', () => {
  const originalDocument = globalThis.document;
  const originalUrl = globalThis.URL;
  const originalWindow = globalThis.window;

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, 'document', { value: originalDocument, configurable: true });
    Object.defineProperty(globalThis, 'URL', { value: originalUrl, configurable: true });
    Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true });
  });

  it('creates an appended anchor, clicks it, and revokes the object URL after cleanup', () => {
    vi.useFakeTimers();

    const click = vi.fn();
    const remove = vi.fn();
    const anchor = {
      href: '',
      download: '',
      rel: '',
      style: { display: '' },
      click,
      remove,
    };
    const appendChild = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:download-url');
    const revokeObjectURL = vi.fn();

    Object.defineProperty(globalThis, 'document', {
      value: {
        createElement: vi.fn(() => anchor),
        body: { appendChild },
      },
      configurable: true,
    });
    Object.defineProperty(globalThis, 'URL', {
      value: { createObjectURL, revokeObjectURL },
      configurable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: { setTimeout: globalThis.setTimeout },
      configurable: true,
    });

    downloadBlob(new Blob(['pdf'], { type: 'application/pdf' }), 'output.pdf');

    expect(anchor.href).toBe('blob:download-url');
    expect(anchor.download).toBe('output.pdf');
    expect(anchor.rel).toBe('noopener');
    expect(anchor.style.display).toBe('none');
    expect(appendChild).toHaveBeenCalledWith(anchor);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:download-url');
  });
});
