import { describe, expect, it } from 'vitest';
import type { TaskLog } from '../../types';
import {
  aggregateHistoryMetrics,
  buildActivityDays,
  formatBytes,
  formatDuration,
} from '../historyMetrics';

const baseTime = Date.UTC(2026, 4, 21);

function createLog(overrides: Partial<TaskLog>): TaskLog {
  return {
    id: crypto.randomUUID(),
    timestamp: baseTime,
    tool: 'compress',
    fileCount: 1,
    totalOriginalSize: 10 * 1024 * 1024,
    totalProcessedSize: 4 * 1024 * 1024,
    processingTimeMs: 1200,
    bandwidthSavedBytes: 10 * 1024 * 1024,
    timeSavedSeconds: 14,
    ...overrides,
  };
}

describe('historyMetrics', () => {
  it('accumulates dashboard totals from seeded mock history logs', () => {
    const logs = [
      createLog({ fileCount: 2, totalOriginalSize: 12_000, totalProcessedSize: 7_000, processingTimeMs: 2100, bandwidthSavedBytes: 12_000 }),
      createLog({ fileCount: 3, totalOriginalSize: 10_000, totalProcessedSize: 16_000, processingTimeMs: 3900, bandwidthSavedBytes: 10_000 }),
      createLog({ fileCount: 1, totalOriginalSize: 8_000, totalProcessedSize: 2_000, processingTimeMs: 1000, bandwidthSavedBytes: 8_000 }),
    ];

    expect(aggregateHistoryMetrics(logs)).toEqual({
      totalDataSavedBytes: 11_000,
      totalLocalProcessingMs: 7000,
      totalBandwidthBypassedBytes: 30_000,
      totalFilesProcessed: 6,
    });
  });

  it('builds daily activity intensity buckets for the SVG grid', () => {
    const logs = [
      createLog({ timestamp: baseTime }),
      createLog({ timestamp: baseTime }),
      createLog({ timestamp: baseTime - 24 * 60 * 60 * 1000 }),
    ];

    const days = buildActivityDays(logs, 3, baseTime);

    expect(days.map((day) => day.count)).toEqual([0, 1, 2]);
    expect(days.map((day) => day.intensity)).toEqual([0, 1, 2]);
  });

  it('formats metric labels for cards', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatDuration(125_000)).toBe('2m 5s');
  });
});
