import { describe, expect, it } from 'vitest';
import { parseSplitRanges } from '../splitRanges';

describe('parseSplitRanges', () => {
  it('parses comma-separated single pages and ranges', () => {
    expect(parseSplitRanges('1-3, 5, 7-8', 10)).toEqual([
      { start: 1, end: 3 },
      { start: 5, end: 5 },
      { start: 7, end: 8 },
    ]);
  });

  it('defaults to one output per known page when input is empty', () => {
    expect(parseSplitRanges('', 3)).toEqual([
      { start: 1, end: 1 },
      { start: 2, end: 2 },
      { start: 3, end: 3 },
    ]);
  });

  it('rejects malformed and out-of-bounds ranges', () => {
    expect(() => parseSplitRanges('abc', 3)).toThrow('Invalid split range');
    expect(() => parseSplitRanges('2-8', 3)).toThrow('exceeds the 3-page document');
  });
});
