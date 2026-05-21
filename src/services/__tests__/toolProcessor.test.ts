import { describe, expect, it } from 'vitest';
import type { FileMetadata } from '../../types';
import { validateToolRequest, type ToolExecutionConfig } from '../toolProcessor';

const baseConfig: ToolExecutionConfig = {
  compressionTier: 'recommended',
  splitRangeInput: '',
  ocrLanguage: 'eng',
  protectPassword: '',
  protectConfirmPassword: '',
  unlockPassword: '',
  pageNumberOptions: {
    position: 'bottom-right',
    format: 'Page {n} of {total}',
    font: 'helvetica',
    color: '#111111',
    size: 12,
    margin: 36,
  },
  watermarkOptions: {
    type: 'text',
    text: 'CONFIDENTIAL',
    image: null,
    imageName: null,
    opacity: 0.3,
    rotation: 45,
    font: 'helvetica',
    color: '#111111',
    size: 48,
  },
  cropBox: {
    x: 0,
    y: 0,
    width: 300,
    height: 300,
  },
  editAnnotations: [{
    type: 'text',
    pageIndex: 0,
    viewportWidth: 300,
    viewportHeight: 300,
    x: 36,
    y: 36,
    text: 'CONFIDENTIAL',
    size: 18,
    color: '#111111',
  }],
  formFillOptions: {
    fields: [{ name: 'name', value: 'Ada' }],
    flatten: true,
  },
  imageToPdfOptions: {
    pageSize: 'image',
    orientation: 'portrait',
    margin: 0,
  },
};

const pdfFile: FileMetadata = {
  id: 'file',
  name: 'file.pdf',
  size: 4,
  type: 'application/pdf',
  blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
};

const imageFile: FileMetadata = {
  id: 'image',
  name: 'photo.jpg',
  size: 4,
  type: 'image/jpeg',
  blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/jpeg' }),
};

const docxFile: FileMetadata = {
  id: 'docx',
  name: 'resume.docx',
  size: 4,
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  blob: new Blob([new Uint8Array([80, 75, 3, 4])], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }),
};

describe('toolProcessor validation', () => {
  it('requires two files for merge', () => {
    expect(() => validateToolRequest({
      activeTool: 'merge',
      files: [pdfFile],
      config: baseConfig,
    })).toThrow('at least two');
  });

  it('requires exactly one file for single-file tools', () => {
    expect(() => validateToolRequest({
      activeTool: 'ocr',
      files: [pdfFile, { ...pdfFile, id: 'second' }],
      config: baseConfig,
    })).toThrow('exactly one');
  });

  it('validates protect and unlock passwords', () => {
    expect(() => validateToolRequest({
      activeTool: 'protect',
      files: [pdfFile],
      config: { ...baseConfig, protectPassword: 'one', protectConfirmPassword: 'two' },
    })).toThrow('confirmation');

    expect(() => validateToolRequest({
      activeTool: 'unlock',
      files: [pdfFile],
      config: baseConfig,
    })).toThrow('password');
  });

  it('accepts one or more JPG to PDF image files', () => {
    expect(() => validateToolRequest({
      activeTool: 'jpgToPdf',
      files: [imageFile, { ...imageFile, id: 'second', name: 'scan.png', type: 'image/png' }],
      config: baseConfig,
    })).not.toThrow();
  });

  it('rejects non-image files for JPG to PDF', () => {
    expect(() => validateToolRequest({
      activeTool: 'jpgToPdf',
      files: [pdfFile],
      config: baseConfig,
    })).toThrow('JPG to PDF');
  });

  it('accepts exactly one DOCX file for Word to PDF', () => {
    expect(() => validateToolRequest({
      activeTool: 'wordToPdf',
      files: [docxFile],
      config: baseConfig,
    })).not.toThrow();
  });

  it('rejects non-DOCX files for Word to PDF', () => {
    expect(() => validateToolRequest({
      activeTool: 'wordToPdf',
      files: [pdfFile],
      config: baseConfig,
    })).toThrow('DOCX');
  });
});
