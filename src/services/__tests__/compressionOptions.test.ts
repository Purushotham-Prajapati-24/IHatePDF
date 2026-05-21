import { describe, expect, it } from 'vitest';
import { calculateRasterScale, getCompressionSettings } from '../compressionOptions';

describe('compressionOptions', () => {
  it('maps compression tiers to the product DPI thresholds', () => {
    expect(getCompressionSettings('extreme').dpi).toBe(72);
    expect(getCompressionSettings('recommended').dpi).toBe(150);
    expect(getCompressionSettings('low').dpi).toBe(220);
  });

  it('calculates the PDF point to raster scale', () => {
    expect(calculateRasterScale(72)).toBe(1);
    expect(calculateRasterScale(144)).toBe(2);
  });
});
