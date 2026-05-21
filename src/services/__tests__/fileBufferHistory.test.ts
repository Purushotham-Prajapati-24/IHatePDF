import { describe, expect, it } from 'vitest';
import type { FileBufferRecord } from '../../db/localDb';
import { filterFileBufferRecords, sortFileBufferRecords } from '../fileBufferHistory';

function createRecord(id: string, name: string, timestamp: number): FileBufferRecord {
  return {
    id,
    name,
    timestamp,
    size: 1024,
    blob: new Blob(['pdf'], { type: 'application/pdf' }),
  };
}

describe('fileBufferHistory', () => {
  it('filters cached files by case-insensitive filename', () => {
    const records = [
      createRecord('a', 'Invoice-May.pdf', 1),
      createRecord('b', 'lecture-notes.pdf', 2),
    ];

    expect(filterFileBufferRecords(records, 'invoice')).toEqual([records[0]]);
    expect(filterFileBufferRecords(records, '  NOTES  ')).toEqual([records[1]]);
  });

  it('sorts cached files newest first without mutating input', () => {
    const older = createRecord('older', 'older.pdf', 100);
    const newer = createRecord('newer', 'newer.pdf', 200);
    const records = [older, newer];

    expect(sortFileBufferRecords(records)).toEqual([newer, older]);
    expect(records).toEqual([older, newer]);
  });
});
