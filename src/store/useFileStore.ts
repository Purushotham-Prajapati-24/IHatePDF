import { create } from 'zustand';
import { devtools, persist, StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  FileMetadata,
  ToolType,
  JobStatus,
  SelectedPage,
  DonationMilestones,
  TaskLog,
  PdfPageSize
} from '../types';
import type { CompressionTier } from '../services/compressionOptions';
import type {
  CropBox,
  ExcelToPdfOptions,
  HtmlToPdfOptions,
  ImageToPdfOptions,
  PageNumberOptions,
  PdfEditAnnotation,
  PdfFormFillOptions,
  PdfToPowerPointOptions,
  WatermarkOptions,
} from '../services/pdfOperations';
import { processActiveTool, validateToolRequest } from '../services/toolProcessor';
import { saveFileToBuffer, saveTaskLog } from '../db/localDb';
import type { ConversionEngine, ConversionMode } from '../services/conversionGateway';

interface FileState {
  // --- Active Files & Queue State ---
  files: FileMetadata[];
  activeTool: ToolType | null;
  status: JobStatus;
  progress: number; // 0 to 100
  errorMessage: string | null;
  processedBlob: Blob | null;
  processedFileName: string | null;
  processedNotice: string | null;
  processedEngine: ConversionEngine | null;
  compressionTier: CompressionTier;
  conversionMode: ConversionMode | null;
  conversionServiceConfirmed: boolean;
  splitRangeInput: string;
  ocrLanguage: string;
  protectPassword: string;
  protectConfirmPassword: string;
  unlockPassword: string;
  pageNumberOptions: PageNumberOptions;
  watermarkOptions: WatermarkOptions;
  cropBox: CropBox;
  editAnnotations: PdfEditAnnotation[];
  formFillOptions: PdfFormFillOptions;
  imageToPdfOptions: ImageToPdfOptions;
  excelToPdfOptions: ExcelToPdfOptions;
  htmlToPdfOptions: HtmlToPdfOptions;
  pdfToPowerPointOptions: PdfToPowerPointOptions;
  
  // --- Page Organizer Specific State ---
  selectedPages: SelectedPage[]; // Used for split or visual re-ordering grid
  
  // --- UI & Transparency State ---
  donationStats: DonationMilestones;
  isDonationModalOpen: boolean;
  theme: 'dark' | 'light';
  
  // --- Actions ---
  setFiles: (files: FileMetadata[]) => void;
  addFiles: (files: FileMetadata[]) => void;
  removeFile: (id: string) => void;
  clearQueue: () => void;
  setActiveTool: (tool: ToolType | null) => void;
  setCompressionTier: (tier: CompressionTier) => void;
  setConversionMode: (mode: ConversionMode) => void;
  setConversionServiceConfirmed: (confirmed: boolean) => void;
  setSplitRangeInput: (rangeInput: string) => void;
  setOcrLanguage: (language: string) => void;
  setProtectPassword: (password: string) => void;
  setProtectConfirmPassword: (password: string) => void;
  setUnlockPassword: (password: string) => void;
  setPageNumberOptions: (options: Partial<PageNumberOptions>) => void;
  setWatermarkOptions: (options: Partial<WatermarkOptions>) => void;
  setCropBox: (cropBox: Partial<CropBox>) => void;
  setEditAnnotations: (annotations: PdfEditAnnotation[]) => void;
  setFormFillOptions: (options: PdfFormFillOptions) => void;
  setImageToPdfOptions: (options: Partial<ImageToPdfOptions>) => void;
  setExcelToPdfOptions: (options: Partial<ExcelToPdfOptions>) => void;
  setHtmlToPdfOptions: (options: Partial<HtmlToPdfOptions>) => void;
  setPdfToPowerPointOptions: (options: Partial<PdfToPowerPointOptions>) => void;
  updateFileRotation: (id: string, rotation: number) => void;
  updateFilePreviews: (id: string, previewUrls: string[], pageSizes?: PdfPageSize[]) => void;
  reorderFiles: (startIndex: number, endIndex: number) => void;
  
  // --- Page Actions ---
  initSelectedPages: () => void;
  setPageOrder: (pages: SelectedPage[]) => void;
  rotatePage: (fileId: string, pageIndex: number) => void;
  deletePage: (fileId: string, pageIndex: number) => void;
  
  // --- Processing Actions ---
  setStatus: (status: JobStatus) => void;
  setProgress: (progress: number) => void;
  executeTool: () => Promise<void>; // Offloads task to corresponding Service / Web Worker
  
  // --- Telemetry & Analytics Actions ---
  incrementCompletedTasks: (log: Omit<TaskLog, 'id' | 'timestamp'>) => Promise<void>;
  markDonated: () => void;
  toggleDonationModal: (isOpen: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

// Custom storage to persist only specific fields (like donationStats, theme)
const customStorage: StateStorage = {
  getItem: (name: string): string | null => {
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

export const useFileStore = create<FileState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // --- Initial State ---
        files: [],
        activeTool: null,
        status: 'idle',
        progress: 0,
        errorMessage: null,
        processedBlob: null,
        processedFileName: null,
        processedNotice: null,
        processedEngine: null,
        compressionTier: 'recommended',
  conversionMode: null,
        conversionServiceConfirmed: false,
        splitRangeInput: '',
        ocrLanguage: 'eng',
        protectPassword: '',
        protectConfirmPassword: '',
        unlockPassword: '',
        pageNumberOptions: {
          position: 'bottom-right',
          format: 'Page {n} of {total}',
          font: 'helvetica',
          color: '#111111',
          size: 12,
          margin: 36,
        },
        watermarkOptions: {
          type: 'text',
          text: 'CONFIDENTIAL',
          image: null,
          imageName: null,
          opacity: 0.3,
          rotation: 45,
          font: 'helvetica',
          color: '#111111',
          size: 48,
        },
        cropBox: {
          x: 0,
          y: 0,
          width: 300,
          height: 300,
        },
        editAnnotations: [{
          type: 'text',
          pageIndex: 0,
          viewportWidth: 300,
          viewportHeight: 300,
          x: 36,
          y: 36,
          text: 'CONFIDENTIAL',
          size: 18,
          color: '#111111',
        }],
        formFillOptions: {
          fields: [{ name: '', value: '' }],
          flatten: true,
        },
        imageToPdfOptions: {
          pageSize: 'image',
          orientation: 'portrait',
          margin: 0,
        },
        excelToPdfOptions: {
          selectedSheets: [],
          orientation: 'landscape',
          pageSize: 'a4',
        },
        htmlToPdfOptions: {
          pageSize: 'a4',
          orientation: 'portrait',
          margin: 36,
        },
        pdfToPowerPointOptions: {
          layout: '16x9',
          includeImages: true,
          fontFace: 'Arial',
        },
        selectedPages: [],
        donationStats: {
          totalTasksCompleted: 0,
          lastDonationPromptTimestamp: null,
          hasDonated: false,
          totalTimeSavedSeconds: 0,
          totalBandwidthSavedBytes: 0,
        },
        isDonationModalOpen: false,
        theme: 'dark',

        // --- Actions ---
        setFiles: (files) => set((state) => {
          state.files = files;
        }),
        addFiles: (files) => set((state) => {
          state.files.push(...files);
        }),
        removeFile: (id) => set((state) => {
          state.files = state.files.filter((f) => f.id !== id);
        }),
        clearQueue: () => set((state) => {
          state.files = [];
          state.selectedPages = [];
          state.status = 'idle';
          state.progress = 0;
          state.errorMessage = null;
          state.processedBlob = null;
          state.processedFileName = null;
          state.processedNotice = null;
          state.processedEngine = null;
        }),
        setActiveTool: (tool) => set((state) => {
          state.activeTool = tool;
        }),
        setCompressionTier: (tier) => set((state) => {
          state.compressionTier = tier;
        }),
        setConversionMode: (mode) => set((state) => {
          state.conversionMode = mode;
          state.conversionServiceConfirmed = mode === 'local-only' ? false : state.conversionServiceConfirmed;
        }),
        setConversionServiceConfirmed: (confirmed) => set((state) => {
          state.conversionServiceConfirmed = confirmed;
        }),
        setSplitRangeInput: (rangeInput) => set((state) => {
          state.splitRangeInput = rangeInput;
        }),
        setOcrLanguage: (language) => set((state) => {
          state.ocrLanguage = language;
        }),
        setProtectPassword: (password) => set((state) => {
          state.protectPassword = password;
        }),
        setProtectConfirmPassword: (password) => set((state) => {
          state.protectConfirmPassword = password;
        }),
        setUnlockPassword: (password) => set((state) => {
          state.unlockPassword = password;
        }),
        setPageNumberOptions: (options) => set((state) => {
          state.pageNumberOptions = { ...state.pageNumberOptions, ...options };
        }),
        setWatermarkOptions: (options) => set((state) => {
          state.watermarkOptions = { ...state.watermarkOptions, ...options };
        }),
        setCropBox: (cropBox) => set((state) => {
          state.cropBox = { ...state.cropBox, ...cropBox };
        }),
        setEditAnnotations: (annotations) => set((state) => {
          state.editAnnotations = annotations;
        }),
        setFormFillOptions: (options) => set((state) => {
          state.formFillOptions = options;
        }),
        setImageToPdfOptions: (options) => set((state) => {
          state.imageToPdfOptions = { ...state.imageToPdfOptions, ...options };
        }),
        setExcelToPdfOptions: (options) => set((state) => {
          state.excelToPdfOptions = { ...state.excelToPdfOptions, ...options };
        }),
        setHtmlToPdfOptions: (options) => set((state) => {
          state.htmlToPdfOptions = { ...state.htmlToPdfOptions, ...options };
        }),
        setPdfToPowerPointOptions: (options) => set((state) => {
          state.pdfToPowerPointOptions = { ...state.pdfToPowerPointOptions, ...options };
        }),
        updateFileRotation: (id, rotation) => set((state) => {
          const file = state.files.find((f) => f.id === id);
          if (file) {
            file.rotation = rotation;
          }
        }),
        updateFilePreviews: (id, previewUrls, pageSizes) => set((state) => {
          const file = state.files.find((f) => f.id === id);
          if (file) {
            file.previewUrls = previewUrls;
            file.pageSizes = pageSizes;
            file.totalPages = previewUrls.length;
          }
        }),
        reorderFiles: (startIndex, endIndex) => set((state) => {
          const result = Array.from(state.files);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          state.files = result;
        }),

        // --- Page Actions ---
        initSelectedPages: () => set((state) => {
          state.selectedPages = state.files.flatMap((file) =>
            Array.from({ length: file.totalPages ?? 0 }, (_, pageIndex) => ({
              fileId: file.id,
              pageIndex,
              rotation: file.rotation ?? 0,
            }))
          );
        }),
        setPageOrder: (pages) => set((state) => {
          state.selectedPages = pages;
        }),
        rotatePage: (fileId, pageIndex) => set((state) => {
          const page = state.selectedPages.find(
            (selectedPage) => selectedPage.fileId === fileId && selectedPage.pageIndex === pageIndex,
          );

          if (page) {
            page.rotation = (page.rotation + 90) % 360;
          }
        }),
        deletePage: (fileId, pageIndex) => set((state) => {
          state.selectedPages = state.selectedPages.filter(
            (selectedPage) => selectedPage.fileId !== fileId || selectedPage.pageIndex !== pageIndex,
          );
        }),

        // --- Processing Actions ---
        setStatus: (status) => set((state) => {
          state.status = status;
        }),
        setProgress: (progress) => set((state) => {
          state.progress = progress;
        }),
        executeTool: async () => {
          const snapshot = get();
          const config = {
            compressionTier: snapshot.compressionTier,
            splitRangeInput: snapshot.splitRangeInput,
            ocrLanguage: snapshot.ocrLanguage,
            protectPassword: snapshot.protectPassword,
            protectConfirmPassword: snapshot.protectConfirmPassword,
            unlockPassword: snapshot.unlockPassword,
            pageNumberOptions: snapshot.pageNumberOptions,
            watermarkOptions: snapshot.watermarkOptions,
            cropBox: snapshot.cropBox,
            editAnnotations: snapshot.editAnnotations,
            formFillOptions: snapshot.formFillOptions,
            imageToPdfOptions: snapshot.imageToPdfOptions,
            excelToPdfOptions: snapshot.excelToPdfOptions,
            htmlToPdfOptions: snapshot.htmlToPdfOptions,
            pdfToPowerPointOptions: snapshot.pdfToPowerPointOptions,
            conversionMode: snapshot.conversionMode,
            conversionServiceConfirmed: snapshot.conversionServiceConfirmed,
          };

          try {
            validateToolRequest({
              activeTool: snapshot.activeTool,
              files: snapshot.files,
              config,
            });
          } catch (error) {
            set((state) => {
              state.status = 'failed';
              state.errorMessage = error instanceof Error ? error.message : 'Tool validation failed.';
              state.processedBlob = null;
              state.processedFileName = null;
              state.processedNotice = null;
              state.processedEngine = null;
            });
            return;
          }

          try {
            set((state) => {
              state.status = 'reading';
              state.progress = 15;
              state.errorMessage = null;
              state.processedBlob = null;
              state.processedFileName = null;
              state.processedNotice = null;
              state.processedEngine = null;
            });

            const startTime = Date.now();
            const { files, activeTool } = get();
            const totalOriginalSize = files.reduce((acc, f) => acc + f.size, 0);

            const buffers = await Promise.all(files.map((file) => file.blob.arrayBuffer()));

            set((state) => {
              state.status = 'processing';
              state.progress = 55;
            });

            const { outputBuffer, outputFileName, outputMimeType, notice, engine } = await processActiveTool({
              activeTool: get().activeTool,
              files,
              buffers,
              selectedPages: get().selectedPages,
              config: {
                compressionTier: get().compressionTier,
                splitRangeInput: get().splitRangeInput,
                ocrLanguage: get().ocrLanguage,
                protectPassword: get().protectPassword,
                protectConfirmPassword: get().protectConfirmPassword,
                unlockPassword: get().unlockPassword,
                pageNumberOptions: get().pageNumberOptions,
                watermarkOptions: get().watermarkOptions,
                cropBox: get().cropBox,
                editAnnotations: get().editAnnotations,
                formFillOptions: get().formFillOptions,
                imageToPdfOptions: get().imageToPdfOptions,
                excelToPdfOptions: get().excelToPdfOptions,
                htmlToPdfOptions: get().htmlToPdfOptions,
                pdfToPowerPointOptions: get().pdfToPowerPointOptions,
                conversionMode: get().conversionMode,
                conversionServiceConfirmed: get().conversionServiceConfirmed,
              },
            });

            const endTime = Date.now();
            const processingTimeMs = endTime - startTime;
            const totalProcessedSize = outputBuffer.byteLength;
            const processedBlob = new Blob([outputBuffer], { type: outputMimeType });

            // Heuristic for transparency dashboard:
            // Bandwidth saved is simply the original size (data never uploaded)
            const bandwidthSavedBytes = totalOriginalSize;
            // Time saved heuristic: assume 1.5MB/s avg upload + download + queue latency
            const timeSavedSeconds = Math.round(totalOriginalSize / (1024 * 1024 * 1.5)) + 5;

            const jobId = crypto.randomUUID();

            const taskLog: TaskLog = {
              id: jobId,
              timestamp: endTime,
              tool: activeTool || 'organize',
              fileCount: files.length,
              totalOriginalSize,
              totalProcessedSize,
              processingTimeMs,
              bandwidthSavedBytes,
              timeSavedSeconds,
            };

            try {
              await saveFileToBuffer({
                id: jobId,
                name: outputFileName,
                size: totalProcessedSize,
                blob: processedBlob,
                timestamp: endTime,
              });
              await saveTaskLog(taskLog);
            } catch {
              // Processing output must remain downloadable even if local history storage is unavailable.
            }

            await get().incrementCompletedTasks(taskLog);

            set((state) => {
              state.status = 'success';
              state.progress = 100;
              state.processedBlob = processedBlob;
              state.processedFileName = outputFileName;
              state.processedNotice = notice ?? null;
              state.processedEngine = engine ?? null;
            });
          } catch (error) {
            set((state) => {
              state.status = 'failed';
              state.errorMessage =
                error instanceof Error ? error.message : 'Local worker processing failed.';
              state.processedBlob = null;
              state.processedFileName = null;
              state.processedNotice = null;
              state.processedEngine = null;
            });
          }
        },

        // --- Telemetry & Analytics Actions ---
        incrementCompletedTasks: async (log) => {
          set((state) => {
            state.donationStats.totalTasksCompleted += 1;
            state.donationStats.totalTimeSavedSeconds += log.timeSavedSeconds;
            state.donationStats.totalBandwidthSavedBytes += log.bandwidthSavedBytes;
          });
        },
        markDonated: () => set((state) => {
          state.donationStats.hasDonated = true;
          state.isDonationModalOpen = false;
        }),
        toggleDonationModal: (isOpen) => set((state) => {
          state.isDonationModalOpen = isOpen;
        }),
        setTheme: (theme) => set((state) => {
          state.theme = theme;
        }),
      })),
      {
        name: 'ihatepdf-storage',
        // Only persist specific keys to localStorage (don't persist Blob objects!)
        partialize: (state) => ({
          donationStats: state.donationStats,
          theme: state.theme,
        }),
      }
    )
  )
);
