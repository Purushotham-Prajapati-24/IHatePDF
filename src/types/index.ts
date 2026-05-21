export type ToolType = 
  | 'merge' 
  | 'split' 
  | 'compress' 
  | 'rotate' 
  | 'ocr' 
  | 'organize' 
  | 'protect' 
  | 'unlock';

export type JobStatus = 'idle' | 'reading' | 'processing' | 'success' | 'failed' | 'warning';

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  blob: Blob;
  previewUrls?: string[]; // Generated canvas previews (object URLs)
  totalPages?: number;
  rotation?: number;      // Individual page/file rotation: 0, 90, 180, 270
}

export interface SelectedPage {
  fileId: string;
  pageIndex: number;
  rotation: number;
}

export interface TaskLog {
  id: string;
  timestamp: number;
  tool: ToolType;
  fileCount: number;
  totalOriginalSize: number;
  totalProcessedSize: number;
  processingTimeMs: number;
  bandwidthSavedBytes: number; // Bandwidth saved by doing it client-side instead of uploading
  timeSavedSeconds: number;     // Estimated time saved compared to standard network roundtrips
}

export interface DonationMilestones {
  totalTasksCompleted: number;
  lastDonationPromptTimestamp: number | null;
  hasDonated: boolean;
  totalTimeSavedSeconds: number;
  totalBandwidthSavedBytes: number;
}
