import type { CropBox } from '../services/pdfOperations';
import type { PdfPageSize } from '../types';

export interface CropPreviewStyle {
  left: string;
  top: string;
  width: string;
  height: string;
}

export interface CroppedImageStyle {
  left: string;
  top: string;
  width: string;
}

export function createCropPreviewStyle(cropBox: CropBox, pageSize: PdfPageSize): CropPreviewStyle {
  const boundedBox = clampCropBox(cropBox, pageSize);

  return {
    left: toPercent(boundedBox.x / pageSize.width),
    top: toPercent((pageSize.height - boundedBox.y - boundedBox.height) / pageSize.height),
    width: toPercent(boundedBox.width / pageSize.width),
    height: toPercent(boundedBox.height / pageSize.height),
  };
}

export function createCroppedImageStyle(cropBox: CropBox, pageSize: PdfPageSize): CroppedImageStyle {
  const boundedBox = clampCropBox(cropBox, pageSize);
  const topOffset = pageSize.height - boundedBox.y - boundedBox.height;

  return {
    left: toPercent(-boundedBox.x / boundedBox.width),
    top: toPercent(-topOffset / boundedBox.height),
    width: toPercent(pageSize.width / boundedBox.width),
  };
}

function clampCropBox(cropBox: CropBox, pageSize: PdfPageSize): CropBox {
  const x = clamp(cropBox.x, 0, pageSize.width);
  const y = clamp(cropBox.y, 0, pageSize.height);
  const width = clamp(cropBox.width, 1, pageSize.width - x);
  const height = clamp(cropBox.height, 1, pageSize.height - y);

  return { x, y, width, height };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function toPercent(value: number): string {
  return `${(value * 100).toFixed(3)}%`;
}
