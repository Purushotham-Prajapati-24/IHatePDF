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
  excelToPdfOptions: {
    selectedSheets: [],
    orientation: 'landscape',
    pageSize: 'a4',
  },
  htmlToPdfOptions: {
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 36,
  },
  pdfToPowerPointOptions: {
    layout: '16x9',
    includeImages: true,
    fontFace: 'Arial',
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

const pptxFile: FileMetadata = {
  id: 'pptx',
  name: 'deck.pptx',
  size: 4,
  type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  blob: new Blob([new Uint8Array([80, 75, 3, 4])], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  }),
};

const xlsxFile: FileMetadata = {
  id: 'xlsx',
  name: 'invoice.xlsx',
  size: 4,
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  blob: new Blob([new Uint8Array([80, 75, 3, 4])], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }),
};

const htmlFile: FileMetadata = {
  id: 'html',
  name: 'invoice.html',
  size: 4,
  type: 'text/html',
  blob: new Blob(['<h1>Invoice</h1>'], { type: 'text/html' }),
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

  it('validates watermark mode requirements', () => {
    expect(() => validateToolRequest({
      activeTool: 'addWatermark',
      files: [pdfFile],
      config: { ...baseConfig, watermarkOptions: { ...baseConfig.watermarkOptions, text: '' } },
    })).toThrow('text');

    expect(() => validateToolRequest({
      activeTool: 'addWatermark',
      files: [pdfFile],
      config: { ...baseConfig, watermarkOptions: { ...baseConfig.watermarkOptions, type: 'image', image: null, imageName: null } },
    })).toThrow('watermark image');

    expect(() => validateToolRequest({
      activeTool: 'addWatermark',
      files: [pdfFile],
      config: {
        ...baseConfig,
        watermarkOptions: {
          ...baseConfig.watermarkOptions,
          type: 'image',
          text: '',
          image: new Blob([new Uint8Array([1])], { type: 'image/png' }),
          imageName: 'stamp.png',
        },
      },
    })).not.toThrow();
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

  it('accepts exactly one PPTX file for PowerPoint to PDF', () => {
    expect(() => validateToolRequest({
      activeTool: 'powerPointToPdf',
      files: [pptxFile],
      config: baseConfig,
    })).not.toThrow();
  });

  it('rejects non-PPTX files for PowerPoint to PDF', () => {
    expect(() => validateToolRequest({
      activeTool: 'powerPointToPdf',
      files: [pdfFile],
      config: baseConfig,
    })).toThrow('PPTX');
  });

  it('accepts exactly one XLSX file for Excel to PDF', () => {
    expect(() => validateToolRequest({
      activeTool: 'excelToPdf',
      files: [xlsxFile],
      config: baseConfig,
    })).not.toThrow();
  });

  it('rejects non-XLSX files for Excel to PDF', () => {
    expect(() => validateToolRequest({
      activeTool: 'excelToPdf',
      files: [pdfFile],
      config: baseConfig,
    })).toThrow('XLSX');
  });

  it('accepts exactly one HTML file for HTML to PDF', () => {
    expect(() => validateToolRequest({
      activeTool: 'htmlToPdf',
      files: [htmlFile],
      config: baseConfig,
    })).not.toThrow();
  });

  it('rejects non-HTML files for HTML to PDF', () => {
    expect(() => validateToolRequest({
      activeTool: 'htmlToPdf',
      files: [pdfFile],
      config: baseConfig,
    })).toThrow('HTML');
  });
});
