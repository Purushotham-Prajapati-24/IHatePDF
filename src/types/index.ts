export type ToolType = 
  | 'merge' 
  | 'split' 
  | 'compress' 
  | 'rotate' 
  | 'ocr' 
  | 'organize' 
  | 'protect' 
  | 'unlock'
  | 'repair'
  | 'addPageNumbers'
  | 'addWatermark'
  | 'crop'
  | 'edit'
  | 'forms'
  | 'jpgToPdf'
  | 'wordToPdf'
  | 'powerPointToPdf'
  | 'excelToPdf'
  | 'htmlToPdf'
  | 'pdfToJpg'
  | 'pdfToWord'
  | 'pdfToPowerPoint'
  | 'pdfToExcel';

export type PageNumberPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  image?: Blob | null;
  imageName?: string | null;
  opacity: number; // 0.0 to 1.0
  rotation: number; // 0 to 360
  size: number; // For text: font size, for image: scale/max-width percentage?
  color?: string; // For text
}

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
