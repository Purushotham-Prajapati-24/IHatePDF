import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFileStore } from '../useFileStore';
import { FileMetadata } from '../../types';
import { compressPDF, mergePDFs, organizePDF, rotatePDF, splitPDF } from '../../services/pdfService';
import { recognizePdfPages } from '../../services/ocrService';
import { protectPdfWithPassword, unlockPdfWithPassword } from '../../services/qpdfService';

vi.mock('../../services/pdfService', () => ({
  mergePDFs: vi.fn(async () => new Uint8Array([37, 80, 68, 70]).buffer),
  splitPDF: vi.fn(async () => [new Uint8Array([37, 80, 68, 70]).buffer]),
  rotatePDF: vi.fn(async () => new Uint8Array([37, 80, 68, 70]).buffer),
  organizePDF: vi.fn(async () => new Uint8Array([37, 80, 68, 70]).buffer),
  compressPDF: vi.fn(async () => new Uint8Array([37, 80]).buffer),
}));

vi.mock('../../services/ocrService', () => ({
  recognizePdfPages: vi.fn(async () => ['Page text']),
}));

vi.mock('../../services/qpdfService', () => ({
  protectPdfWithPassword: vi.fn(async () => new Uint8Array([37, 80, 68, 70]).buffer),
  unlockPdfWithPassword: vi.fn(async () => new Uint8Array([37, 80, 68, 70]).buffer),
}));

describe('useFileStore', () => {
  beforeEach(() => {
    useFileStore.getState().clearQueue();
    useFileStore.getState().setActiveTool(null);
    useFileStore.getState().setCompressionTier('recommended');
    useFileStore.getState().setSplitRangeInput('');
    useFileStore.getState().setOcrLanguage('eng');
    useFileStore.getState().setProtectPassword('');
    useFileStore.getState().setProtectConfirmPassword('');
    useFileStore.getState().setUnlockPassword('');
    vi.clearAllMocks();
  });

  it('should add files correctly', () => {
    const mockFile: FileMetadata = {
      id: '1',
      name: 'test.pdf',
      size: 1000,
      type: 'application/pdf',
      blob: new Blob(['test'], { type: 'application/pdf' }),
      rotation: 0,
    };

    useFileStore.getState().addFiles([mockFile]);
    expect(useFileStore.getState().files.length).toBe(1);
    expect(useFileStore.getState().files[0].id).toBe('1');
  });

  it('should remove a file correctly', () => {
    const mockFile: FileMetadata = {
      id: '1',
      name: 'test.pdf',
      size: 1000,
      type: 'application/pdf',
      blob: new Blob(['test'], { type: 'application/pdf' }),
      rotation: 0,
    };

    useFileStore.getState().addFiles([mockFile]);
    expect(useFileStore.getState().files.length).toBe(1);

    useFileStore.getState().removeFile('1');
    expect(useFileStore.getState().files.length).toBe(0);
  });

  it('should update file rotation', () => {
    const mockFile: FileMetadata = {
      id: '2',
      name: 'rotate.pdf',
      size: 1000,
      type: 'application/pdf',
      blob: new Blob(['test'], { type: 'application/pdf' }),
      rotation: 0,
    };

    useFileStore.getState().addFiles([mockFile]);
    useFileStore.getState().updateFileRotation('2', 90);
    
    expect(useFileStore.getState().files[0].rotation).toBe(90);
  });

  it('should clear the queue completely', () => {
    const mockFile: FileMetadata = {
      id: '3',
      name: 'clear.pdf',
      size: 1000,
      type: 'application/pdf',
      blob: new Blob(['test'], { type: 'application/pdf' }),
      rotation: 0,
    };

    useFileStore.getState().addFiles([mockFile]);
    useFileStore.getState().setStatus('processing');
    useFileStore.getState().clearQueue();
    
    const state = useFileStore.getState();
    expect(state.files.length).toBe(0);
    expect(state.status).toBe('idle');
  });

  it('stores the processed PDF blob and filename after execution', async () => {
    const mockFile: FileMetadata = {
      id: '4',
      name: 'input.pdf',
      size: 4,
      type: 'application/pdf',
      blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
      rotation: 0,
    };
    const secondFile: FileMetadata = {
      ...mockFile,
      id: '4b',
      name: 'second.pdf',
      blob: new Blob([new Uint8Array([5, 6, 7, 8])], { type: 'application/pdf' }),
    };

    useFileStore.getState().setActiveTool('merge');
    useFileStore.getState().addFiles([mockFile, secondFile]);

    await useFileStore.getState().executeTool();

    const state = useFileStore.getState();
    expect(mergePDFs).toHaveBeenCalledOnce();
    expect(state.status).toBe('success');
    expect(state.processedBlob).toBeInstanceOf(Blob);
    expect(state.processedBlob?.type).toBe('application/pdf');
    expect(state.processedFileName).toBe('merged-document.pdf');
  });

  it('rejects merge execution with fewer than two PDFs', async () => {
    const mockFile: FileMetadata = {
      id: '4c',
      name: 'input.pdf',
      size: 4,
      type: 'application/pdf',
      blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
    };

    useFileStore.getState().setActiveTool('merge');
    useFileStore.getState().addFiles([mockFile]);

    await useFileStore.getState().executeTool();

    expect(mergePDFs).not.toHaveBeenCalled();
    expect(useFileStore.getState().status).toBe('failed');
    expect(useFileStore.getState().errorMessage).toContain('at least two');
  });

  it('passes the selected compression tier into the compressor', async () => {
    const mockFile: FileMetadata = {
      id: '5',
      name: 'photo.pdf',
      size: 4,
      type: 'application/pdf',
      blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
      rotation: 0,
    };

    useFileStore.getState().setActiveTool('compress');
    useFileStore.getState().setCompressionTier('extreme');
    useFileStore.getState().addFiles([mockFile]);

    await useFileStore.getState().executeTool();

    expect(compressPDF).toHaveBeenCalledWith(expect.any(ArrayBuffer), 'extreme');
    expect(useFileStore.getState().processedFileName).toBe('photo-compressed.pdf');
  });

  it('falls back to a downloadable original PDF when browser compression is unsupported', async () => {
    vi.mocked(compressPDF).mockRejectedValueOnce(new Error('PDF compression requires OffscreenCanvas support.'));
    const mockFile: FileMetadata = {
      id: '6',
      name: 'fallback.pdf',
      size: 4,
      type: 'application/pdf',
      blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
      rotation: 0,
    };

    useFileStore.getState().setActiveTool('compress');
    useFileStore.getState().addFiles([mockFile]);

    await useFileStore.getState().executeTool();

    const state = useFileStore.getState();
    expect(state.status).toBe('success');
    expect(state.processedNotice).toContain('Browser compression is unavailable');
    expect(await state.processedBlob?.arrayBuffer()).toEqual(await mockFile.blob.arrayBuffer());
  });

  it('falls back when PDF.js reports a missing document createElement capability', async () => {
    vi.mocked(compressPDF).mockRejectedValueOnce(new Error("Cannot read properties of undefined (reading 'createElement')"));
    const mockFile: FileMetadata = {
      id: '6b',
      name: 'create-element.pdf',
      size: 4,
      type: 'application/pdf',
      blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
    };

    useFileStore.getState().setActiveTool('compress');
    useFileStore.getState().addFiles([mockFile]);

    await useFileStore.getState().executeTool();

    const state = useFileStore.getState();
    expect(state.status).toBe('success');
    expect(state.processedNotice).toContain('Browser compression is unavailable');
    expect(await state.processedBlob?.arrayBuffer()).toEqual(await mockFile.blob.arrayBuffer());
  });

  it('keeps the original PDF when compression would increase the file size', async () => {
    vi.mocked(compressPDF).mockResolvedValueOnce(new Uint8Array([1, 2, 3, 4, 5, 6]).buffer);
    const mockFile: FileMetadata = {
      id: '7',
      name: 'small.pdf',
      size: 3,
      type: 'application/pdf',
      blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'application/pdf' }),
      rotation: 0,
    };

    useFileStore.getState().setActiveTool('compress');
    useFileStore.getState().addFiles([mockFile]);

    await useFileStore.getState().executeTool();

    expect(await useFileStore.getState().processedBlob?.arrayBuffer()).toEqual(await mockFile.blob.arrayBuffer());
    expect(useFileStore.getState().processedNotice).toContain('did not reduce');
  });

  it('passes page-indexed rotations to rotate without reordering pages', async () => {
    const mockFile: FileMetadata = {
      id: 'rotate',
      name: 'rotate.pdf',
      size: 4,
      type: 'application/pdf',
      blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
      totalPages: 3,
    };

    useFileStore.getState().setActiveTool('rotate');
    useFileStore.getState().addFiles([mockFile]);
    useFileStore.getState().setPageOrder([
      { fileId: 'rotate', pageIndex: 2, rotation: 270 },
      { fileId: 'rotate', pageIndex: 0, rotation: 90 },
    ]);

    await useFileStore.getState().executeTool();

    expect(rotatePDF).toHaveBeenCalledWith(expect.any(ArrayBuffer), [90, 0, 270]);
    expect(useFileStore.getState().processedFileName).toBe('rotate-rotated.pdf');
  });

  it('organizes pages with selected order, deletion, and rotations', async () => {
    const mockFile: FileMetadata = {
      id: 'organize',
      name: 'pages.pdf',
      size: 4,
      type: 'application/pdf',
      blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
      totalPages: 3,
    };

    useFileStore.getState().setActiveTool('organize');
    useFileStore.getState().addFiles([mockFile]);
    useFileStore.getState().setPageOrder([
      { fileId: 'organize', pageIndex: 2, rotation: 180 },
      { fileId: 'organize', pageIndex: 0, rotation: 90 },
    ]);

    await useFileStore.getState().executeTool();

    expect(organizePDF).toHaveBeenCalledWith(expect.any(ArrayBuffer), [
      { pageIndex: 2, rotation: 180 },
      { pageIndex: 0, rotation: 90 },
    ]);
    expect(useFileStore.getState().processedFileName).toBe('pages-organized.pdf');
  });

  it('stores OCR output as a page-labeled text blob', async () => {
    vi.mocked(recognizePdfPages).mockResolvedValueOnce(['Hello world', '']);
    const mockFile: FileMetadata = {
      id: 'ocr',
      name: 'scan.pdf',
      size: 4,
      type: 'application/pdf',
      blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
      totalPages: 2,
    };

    useFileStore.getState().setActiveTool('ocr');
    useFileStore.getState().setOcrLanguage('hin');
    useFileStore.getState().addFiles([mockFile]);

    await useFileStore.getState().executeTool();

    const state = useFileStore.getState();
    expect(recognizePdfPages).toHaveBeenCalledWith(mockFile.blob, { languageCode: 'hin' });
    expect(state.processedBlob?.type).toBe('text/plain');
    expect(state.processedFileName).toBe('scan-ocr.txt');
    expect(await state.processedBlob?.text()).toContain('Page 1\nHello world');
  });

  it('rejects missing and mismatched protect passwords before QPDF execution', async () => {
    const mockFile: FileMetadata = {
      id: 'protect',
      name: 'secret.pdf',
      size: 4,
      type: 'application/pdf',
      blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
    };

    useFileStore.getState().setActiveTool('protect');
    useFileStore.getState().addFiles([mockFile]);
    await useFileStore.getState().executeTool();

    expect(useFileStore.getState().status).toBe('failed');
    expect(protectPdfWithPassword).not.toHaveBeenCalled();

    useFileStore.getState().setProtectPassword('one');
    useFileStore.getState().setProtectConfirmPassword('two');
    await useFileStore.getState().executeTool();

    expect(useFileStore.getState().errorMessage).toContain('confirmation');
    expect(protectPdfWithPassword).not.toHaveBeenCalled();
  });

  it('calls QPDF protect when passwords match', async () => {
    const mockFile: FileMetadata = {
      id: 'protect-valid',
      name: 'secret.pdf',
      size: 4,
      type: 'application/pdf',
      blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
    };

    useFileStore.getState().setActiveTool('protect');
    useFileStore.getState().setProtectPassword('safe-password');
    useFileStore.getState().setProtectConfirmPassword('safe-password');
    useFileStore.getState().addFiles([mockFile]);

    await useFileStore.getState().executeTool();

    expect(protectPdfWithPassword).toHaveBeenCalledWith(expect.any(ArrayBuffer), 'safe-password');
    expect(useFileStore.getState().processedFileName).toBe('secret-protected.pdf');
  });

  it('rejects missing unlock password and handles QPDF unlock failure', async () => {
    vi.mocked(unlockPdfWithPassword).mockRejectedValueOnce(new Error('Unable to unlock this PDF. Check the password and try again.'));
    const mockFile: FileMetadata = {
      id: 'unlock',
      name: 'locked.pdf',
      size: 4,
      type: 'application/pdf',
      blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
    };

    useFileStore.getState().setActiveTool('unlock');
    useFileStore.getState().addFiles([mockFile]);
    await useFileStore.getState().executeTool();

    expect(unlockPdfWithPassword).not.toHaveBeenCalled();
    expect(useFileStore.getState().errorMessage).toContain('password');

    useFileStore.getState().setUnlockPassword('wrong');
    await useFileStore.getState().executeTool();

    expect(unlockPdfWithPassword).toHaveBeenCalledWith(expect.any(ArrayBuffer), 'wrong');
    expect(useFileStore.getState().status).toBe('failed');
    expect(useFileStore.getState().errorMessage).toContain('Unable to unlock');
  });

  it('passes the entered split range into the splitter', async () => {
    const mockFile: FileMetadata = {
      id: '8',
      name: 'book.pdf',
      size: 4,
      type: 'application/pdf',
      blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
      totalPages: 5,
    };

    useFileStore.getState().setActiveTool('split');
    useFileStore.getState().setSplitRangeInput('2-4');
    useFileStore.getState().addFiles([mockFile]);

    await useFileStore.getState().executeTool();

    expect(splitPDF).toHaveBeenCalledWith(expect.any(ArrayBuffer), [{ start: 2, end: 4 }]);
    expect(useFileStore.getState().processedFileName).toBe('book-split-pages-2-4.pdf');
  });

  it('downloads multiple split ranges as a ZIP archive', async () => {
    vi.mocked(splitPDF).mockResolvedValueOnce([
      new Uint8Array([1, 2]).buffer,
      new Uint8Array([3, 4]).buffer,
    ]);
    const mockFile: FileMetadata = {
      id: '9',
      name: 'multi.pdf',
      size: 4,
      type: 'application/pdf',
      blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
      totalPages: 5,
    };

    useFileStore.getState().setActiveTool('split');
    useFileStore.getState().setSplitRangeInput('1-2, 5');
    useFileStore.getState().addFiles([mockFile]);

    await useFileStore.getState().executeTool();

    const state = useFileStore.getState();
    const outputBytes = new Uint8Array(await state.processedBlob!.arrayBuffer());
    expect(state.processedBlob?.type).toBe('application/zip');
    expect(state.processedFileName).toBe('multi-split.zip');
    expect(Array.from(outputBytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it('keeps the workspace visible and reports invalid split ranges', async () => {
    const mockFile: FileMetadata = {
      id: '10',
      name: 'invalid.pdf',
      size: 4,
      type: 'application/pdf',
      blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
      totalPages: 3,
    };

    useFileStore.getState().setActiveTool('split');
    useFileStore.getState().setSplitRangeInput('2-9');
    useFileStore.getState().addFiles([mockFile]);

    await useFileStore.getState().executeTool();

    const state = useFileStore.getState();
    expect(splitPDF).not.toHaveBeenCalled();
    expect(state.status).toBe('failed');
    expect(state.files).toHaveLength(1);
    expect(state.errorMessage).toContain('exceeds the 3-page document');
  });
});
