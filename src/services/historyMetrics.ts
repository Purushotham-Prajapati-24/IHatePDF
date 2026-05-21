import type { TaskLog } from '../types';

export interface HistoryMetrics {
  totalDataSavedBytes: number;
  totalLocalProcessingMs: number;
  totalBandwidthBypassedBytes: number;
  totalFilesProcessed: number;
}

export interface ActivityDay {
  dateKey: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function aggregateHistoryMetrics(logs: TaskLog[]): HistoryMetrics {
  return logs.reduce<HistoryMetrics>(
    (metrics, log) => {
      const savedBytes = Math.max(0, log.totalOriginalSize - log.totalProcessedSize);

      metrics.totalDataSavedBytes += savedBytes;
      metrics.totalLocalProcessingMs += log.processingTimeMs;
      metrics.totalBandwidthBypassedBytes += log.bandwidthSavedBytes;
      metrics.totalFilesProcessed += log.fileCount;

      return metrics;
    },
    {
      totalDataSavedBytes: 0,
      totalLocalProcessingMs: 0,
      totalBandwidthBypassedBytes: 0,
      totalFilesProcessed: 0,
    },
  );
}

export function buildActivityDays(logs: TaskLog[], dayCount = 84, now = Date.now()): ActivityDay[] {
  const startTimestamp = now - (dayCount - 1) * DAY_MS;
  const countsByDate = new Map<string, number>();

  for (const log of logs) {
    const dateKey = toDateKey(log.timestamp);
    countsByDate.set(dateKey, (countsByDate.get(dateKey) ?? 0) + 1);
  }

  return Array.from({ length: dayCount }, (_, index) => {
    const timestamp = startTimestamp + index * DAY_MS;
    const dateKey = toDateKey(timestamp);
    const count = countsByDate.get(dateKey) ?? 0;

    return {
      dateKey,
      count,
      intensity: getActivityIntensity(count),
    };
  });
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';

  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m ${remainingSeconds}s`;
}

function getActivityIntensity(count: number): ActivityDay['intensity'] {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function toDateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}
