import { describe, expect, it } from 'vitest';
import { buildLanguageModelUrl } from '../ocrService';

describe('ocrService', () => {
  it('builds the expected traineddata CDN URL', () => {
    expect(buildLanguageModelUrl('eng', 'https://cdn.example.com/models/')).toBe(
      'https://cdn.example.com/models/eng/4.0.0_best_int/eng.traineddata.gz',
    );
  });
});
