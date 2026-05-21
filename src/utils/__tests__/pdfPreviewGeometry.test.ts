import { describe, expect, it } from 'vitest';
import { createCroppedImageStyle, createCropPreviewStyle } from '../pdfPreviewGeometry';

describe('pdfPreviewGeometry', () => {
  it('maps PDF crop coordinates to top-left CSS percentages', () => {
    expect(createCropPreviewStyle(
      { x: 50, y: 100, width: 200, height: 300 },
      { width: 400, height: 600 },
    )).toEqual({
      left: '12.500%',
      top: '33.333%',
      width: '50.000%',
      height: '50.000%',
    });
  });

  it('positions the full page image inside the cropped result frame', () => {
    expect(createCroppedImageStyle(
      { x: 50, y: 100, width: 200, height: 300 },
      { width: 400, height: 600 },
    )).toEqual({
      left: '-25.000%',
      top: '-66.667%',
      width: '200.000%',
    });
  });
});
