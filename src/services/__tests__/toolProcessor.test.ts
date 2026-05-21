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
};

const pdfFile: FileMetadata = {
  id: 'file',
  name: 'file.pdf',
  size: 4,
  type: 'application/pdf',
  blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }),
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
});
