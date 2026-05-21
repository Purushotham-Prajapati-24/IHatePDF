import type { SplitRange } from './pdfService';

export function parseSplitRanges(input: string, pageCount?: number): SplitRange[] {
  const normalizedInput = input.trim();

  if (!normalizedInput) {
    return createDefaultSplitRanges(pageCount);
  }

  return normalizedInput.split(',').map((part) => parseRangePart(part, pageCount));
}

function createDefaultSplitRanges(pageCount?: number): SplitRange[] {
  if (!pageCount || pageCount < 1) {
    return [{ start: 1, end: 1 }];
  }

  return Array.from({ length: pageCount }, (_, index) => ({
    start: index + 1,
    end: index + 1,
  }));
}

function parseRangePart(part: string, pageCount?: number): SplitRange {
  const trimmedPart = part.trim();
  const match = trimmedPart.match(/^(\d+)(?:\s*-\s*(\d+))?$/);

  if (!match) {
    throw new Error(`Invalid split range "${trimmedPart}". Use formats like 1-5, 8, 11-15.`);
  }

  const start = Number(match[1]);
  const end = Number(match[2] ?? match[1]);

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
    throw new Error(`Invalid split range "${trimmedPart}".`);
  }

  if (pageCount && end > pageCount) {
    throw new Error(`Split range "${trimmedPart}" exceeds the ${pageCount}-page document.`);
  }

  return { start, end };
}
