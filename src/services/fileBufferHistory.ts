import type { FileBufferRecord } from '../db/localDb';

export function filterFileBufferRecords(records: FileBufferRecord[], query: string): FileBufferRecord[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return records;

  return records.filter((record) => record.name.toLowerCase().includes(normalizedQuery));
}

export function sortFileBufferRecords(records: FileBufferRecord[]): FileBufferRecord[] {
  return [...records].sort((a, b) => b.timestamp - a.timestamp);
}
