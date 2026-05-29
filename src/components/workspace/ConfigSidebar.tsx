import React, { useEffect, useState } from 'react';
import { useFileStore } from '../../store/useFileStore';
import { Settings, Shield, Scissors, Minimize2, ArrowRight, Loader2, ScanText, Unlock, LayoutGrid, Stamp, Crop, ImageIcon as Image, PencilLine, FilePenLine, Images, ListChecks, FileText, Presentation, Table2, Monitor, MonitorPlay, Check, Type, ChevronDown, ShieldCheck, Archive, Wrench, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ToolType } from '../../types';
import type { PageNumberFont } from '../../services/pdfOperations';
import { getExcelSheetNames } from '../../services/pdfService';
import { getEngineLabel, getPreferredEngine, isConversionServiceConfigured, type ConversionMode } from '../../services/conversionGateway';
import { CropPreviewPanel } from './CropPreviewPanel';
import { WatermarkPreviewPanel } from './WatermarkPreviewPanel';

type CompressionTier = 'extreme' | 'recommended' | 'low';

const COMPRESSION_TIERS: Array<{
  id: CompressionTier;
  label: string;
  sub: string;
  dpi: string;
}> = [
  { id: 'extreme', label: 'Extreme Compression', sub: 'Less quality, high savings', dpi: '72 DPI' },
  { id: 'recommended', label: 'Recommended', sub: 'Good quality, good savings', dpi: '150 DPI' },
  { id: 'low', label: 'Low Compression', sub: 'High quality, less savings', dpi: '220 DPI' },
];

const CONVERSION_TOOLS = new Set([
  'wordToPdf',
  'powerPointToPdf',
  'excelToPdf',
  'htmlToPdf',
  'pdfToJpg',
  'pdfToWord',
  'pdfToPowerPoint',
  'pdfToExcel',
]);

const getToolColor = (tool: ToolType | null): string => {
  switch (tool) {
    case 'pdfToWord':
    case 'wordToPdf':
    case 'htmlToPdf':
      return 'text-blue-500';
    case 'pdfToExcel':
    case 'excelToPdf':
      return 'text-emerald-500';
    case 'pdfToPowerPoint':
    case 'powerPointToPdf':
      return 'text-orange-500';
    case 'protect':
    case 'unlock':
    case 'forms':
      return 'text-amber-500';
    case 'ocr':
    case 'pdfToJpg':
    case 'jpgToPdf':
      return 'text-cyan-500';
    default:
      return 'text-brand-primary';
  }
};

const getToolColorBg = (tool: ToolType | null): string => {
  switch (tool) {
    case 'pdfToWord':
    case 'wordToPdf':
    case 'htmlToPdf':
      return 'bg-blue-500';
    case 'pdfToExcel':
    case 'excelToPdf':
      return 'bg-emerald-500';
    case 'pdfToPowerPoint':
    case 'powerPointToPdf':
      return 'bg-orange-500';
    case 'protect':
    case 'unlock':
    case 'forms':
      return 'bg-amber-500';
    case 'ocr':
    case 'pdfToJpg':
    case 'jpgToPdf':
      return 'bg-cyan-500';
    default:
      return 'bg-brand-primary';
  }
};

const getToolColorShadow = (tool: ToolType | null): string => {
  switch (tool) {
    case 'pdfToWord':
    case 'wordToPdf':
    case 'htmlToPdf':
      return 'hover:shadow-blue-500/40 shadow-blue-500/20';
    case 'pdfToExcel':
    case 'excelToPdf':
      return 'hover:shadow-emerald-500/40 shadow-emerald-500/20';
    case 'pdfToPowerPoint':
    case 'powerPointToPdf':
      return 'hover:shadow-orange-500/40 shadow-orange-500/20';
    case 'protect':
    case 'unlock':
    case 'forms':
      return 'hover:shadow-amber-500/40 shadow-amber-500/20';
    case 'ocr':
    case 'pdfToJpg':
    case 'jpgToPdf':
      return 'hover:shadow-cyan-500/40 shadow-cyan-500/20';
    default:
      return 'hover:shadow-brand-primary/40 shadow-brand-primary/20';
  }
};

const ConversionModePanel: React.FC<{
  activeTool: ToolType;
  conversionMode: ConversionMode | null;
  conversionServiceConfirmed: boolean;
  setConversionMode: (mode: ConversionMode) => void;
  setConversionServiceConfirmed: (confirmed: boolean) => void;
}> = ({ activeTool, conversionMode, conversionServiceConfirmed, setConversionMode, setConversionServiceConfirmed }) => {
  const serviceConfigured = isConversionServiceConfigured();
  const modes: Array<{ id: ConversionMode; label: string; sub: string }> = [
    { id: 'high-fidelity', label: 'High fidelity', sub: getEngineLabel(getPreferredEngine(activeTool, 'high-fidelity')) },
    { id: 'local-only', label: 'Local-only', sub: 'Lower fidelity browser' },
  ];

  if (activeTool === 'pdfToWord' || activeTool === 'pdfToExcel' || activeTool === 'pdfToPowerPoint') {
    modes.splice(1, 0, { id: 'editable', label: 'Editable', sub: getEngineLabel(getPreferredEngine(activeTool, 'editable')) });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border-glass bg-bg-dark/25 p-4">
      <div className="flex items-center gap-2 text-text-primary">
        <ShieldCheck className={cn("h-4 w-4", getToolColor(activeTool))} />
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Conversion Mode</h3>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setConversionMode(mode.id)}
            className={cn(
              "flex items-center justify-between rounded-xl border-2 p-3 text-left transition-all",
              conversionMode === mode.id
                ? cn("bg-brand-primary/10 text-text-primary", activeTool.includes('Word') || activeTool.includes('ToPdf') ? "border-blue-500" : "border-brand-primary")
                : "border-border-glass bg-bg-dark/30 text-text-secondary hover:border-brand-primary/40"
            )}
          >
            <span className="text-xs font-black uppercase tracking-widest">{mode.label}</span>
            <span className="text-[9px] font-bold uppercase tracking-tight opacity-70">{mode.sub}</span>
          </button>
        ))}
      </div>
      {conversionMode && conversionMode !== 'local-only' && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-primary/15 bg-brand-primary/5 p-3">
          <input
            type="checkbox"
            checked={conversionServiceConfirmed}
            onChange={(event) => setConversionServiceConfirmed(event.target.checked)}
            disabled={!serviceConfigured}
            className={cn("mt-0.5 h-4 w-4 accent-brand-primary disabled:opacity-30", getToolColor(activeTool).replace('text', 'accent'))}
          />
          <span className="text-[10px] font-semibold uppercase leading-5 text-text-secondary">
            {serviceConfigured
              ? 'Process this file on your self-hosted IHatePDF conversion service and delete job files after conversion.'
              : 'No conversion service URL is configured; high-fidelity and editable modes will stop without creating a lower-fidelity output.'}
          </span>
        </label>
      )}
    </div>
  );
};

const ExcelConfig: React.FC = () => {
  const { files, excelToPdfOptions, setExcelToPdfOptions } = useFileStore();
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSheets = async () => {
      if (files.length > 0) {
        setIsLoading(true);
        try {
          const buffer = await files[0].blob.arrayBuffer();
          const names = await getExcelSheetNames(buffer);
          setSheetNames(names);
          if (excelToPdfOptions.selectedSheets.length === 0) {
            setExcelToPdfOptions({ selectedSheets: names });
          }
        } catch (error) {
          console.error('Failed to fetch Excel sheets:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchSheets();
  }, [files, setExcelToPdfOptions, excelToPdfOptions.selectedSheets.length]);

  const toggleSheet = (name: string) => {
    const current = excelToPdfOptions.selectedSheets;
    const next = current.includes(name)
      ? current.filter(s => s !== name)
      : [...current, name];
    setExcelToPdfOptions({ selectedSheets: next });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
        <ListChecks className="w-5 h-5 text-emerald-500" />
        <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Select Sheets</h3>
      </div>

      <div className="space-y-4">
        <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Reading Workbook...</span>
            </div>
          ) : sheetNames.length > 0 ? (
            sheetNames.map((name) => (
              <button
                key={name}
                onClick={() => toggleSheet(name)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left",
                  excelToPdfOptions.selectedSheets.includes(name)
                    ? "border-emerald-500 bg-emerald-500/5 text-text-primary shadow-lg shadow-emerald-500/10"
                    : "border-border-glass bg-bg-dark/20 text-text-secondary hover:border-emerald-500/30"
                )}
              >
                <span className="text-xs font-bold truncate max-w-[180px]">{name}</span>
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                  excelToPdfOptions.selectedSheets.includes(name)
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-text-secondary/40"
                )}>
                  {excelToPdfOptions.selectedSheets.includes(name) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            ))
          ) : (
            <p className="text-[10px] text-text-secondary text-center py-4 uppercase font-black">No sheets found</p>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-border-glass">
           <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Orientation</label>
            <div className="flex p-1 bg-bg-dark/40 rounded-xl border border-border-glass">
              {(['portrait', 'landscape'] as const).map((orientation) => (
                <button
                  key={orientation}
                  onClick={() => setExcelToPdfOptions({ orientation })}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                    excelToPdfOptions.orientation === orientation
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {orientation}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Page Size</label>
            <div className="flex p-1 bg-bg-dark/40 rounded-xl border border-border-glass">
              {(['image', 'a4'] as const).map((pageSize) => (
                <button
                  key={pageSize}
                  onClick={() => setExcelToPdfOptions({ pageSize })}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                    excelToPdfOptions.pageSize === pageSize
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {pageSize === 'image' ? 'Fit Content' : 'A4 Size'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ConfigSidebar: React.FC = () => {
  const {
    activeTool,
    executeTool,
    status,
    files,
    compressionTier,
    conversionMode,
    conversionServiceConfirmed,
    splitRangeInput,
    ocrLanguage,
    protectPassword,
    protectConfirmPassword,
    unlockPassword,
    pageNumberOptions,
    watermarkOptions,
    cropBox,
    editAnnotations,
    formFillOptions,
    imageToPdfOptions,
    excelToPdfOptions,
    htmlToPdfOptions,
    pdfToPowerPointOptions,
    setCompressionTier,
    setConversionMode,
    setConversionServiceConfirmed,
    setSplitRangeInput,
    setOcrLanguage,
    setProtectPassword,
    setProtectConfirmPassword,
    setUnlockPassword,
    setPageNumberOptions,
    setWatermarkOptions,
    setCropBox,
    setEditAnnotations,
    setFormFillOptions,
    setImageToPdfOptions,
    setExcelToPdfOptions,
    setHtmlToPdfOptions,
    setPdfToPowerPointOptions,
  } = useFileStore();

  if (!activeTool) return null;

  const renderToolConfigs = () => {
    const colorClass = getToolColor(activeTool);
    const accentClass = colorClass.replace('text', 'accent');

    switch (activeTool) {
      case 'addWatermark':
        return (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
                <Settings className={cn("w-5 h-5", colorClass)} />
                <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Watermark Type</h3>
              </div>
              <div className="flex p-1 bg-bg-dark/40 rounded-xl border border-border-glass">
                {(['text', 'image'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setWatermarkOptions({
                      type,
                      size: type === 'image' ? Math.min(90, Math.max(5, watermarkOptions.size)) : Math.max(6, watermarkOptions.size),
                    })}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                      watermarkOptions.type === type
                        ? cn(getToolColorBg(activeTool), "text-white shadow-lg")
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {watermarkOptions.type === 'text' ? (
              <div className="flex flex-col gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Watermark Text</label>
                    <input 
                      type="text"
                      value={watermarkOptions.text}
                      onChange={(e) => setWatermarkOptions({ text: e.target.value })}
                      className={cn("w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary placeholder:text-text-secondary/40 outline-none transition-all text-sm focus:border-brand-primary/50", activeTool === 'addWatermark' && "focus:border-brand-primary/50")}
                      placeholder="e.g. CONFIDENTIAL"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Font Size</label>
                      <input 
                        type="number"
                        min={6}
                        max={144}
                        value={watermarkOptions.size}
                        onChange={(e) => setWatermarkOptions({ size: parseInt(e.target.value) || 48 })}
                        className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary focus:border-brand-primary/50 outline-none transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Color</label>
                      <div className="relative">
                        <input 
                          type="text"
                          value={watermarkOptions.color}
                          onChange={(e) => setWatermarkOptions({ color: e.target.value })}
                          className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary focus:border-brand-primary/50 outline-none transition-all text-sm font-mono"
                        />
                        <div 
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md border border-white/10"
                          style={{ backgroundColor: watermarkOptions.color }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Stamp Image</label>
                  <div className="relative group">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setWatermarkOptions({ 
                            image: file,
                            imageName: file.name
                          });
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={cn("w-full p-8 rounded-xl border-2 border-dashed border-border-glass bg-bg-dark/20 transition-all flex flex-col items-center gap-2 text-center", activeTool === 'addWatermark' ? "group-hover:border-brand-primary/50" : "group-hover:border-brand-primary/50")}>
                      <Image className="w-8 h-8 text-text-secondary group-hover:text-brand-primary transition-colors" />
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        {watermarkOptions.imageName || 'Choose Image'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Image Size</label>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="1"
                    value={watermarkOptions.size}
                    onChange={(e) => setWatermarkOptions({ size: parseInt(e.target.value) || 48 })}
                    className={cn("w-full h-1.5 bg-bg-dark/60 rounded-lg appearance-none cursor-pointer", accentClass)}
                  />
                  <span className={cn("block text-right text-xs font-mono", colorClass)}>{watermarkOptions.size}%</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-6 pt-4 border-t border-border-glass">
              {watermarkOptions.type === 'text' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Font Family</label>
                  <select
                    value={watermarkOptions.font}
                    onChange={(e) => setWatermarkOptions({ font: e.target.value as PageNumberFont })}
                    className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary focus:border-brand-primary/50 outline-none transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="helvetica">Helvetica (Standard)</option>
                    <option value="times-roman">Times Roman</option>
                    <option value="courier">Courier</option>
                  </select>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Opacity</label>
                  <span className={cn("text-xs font-mono", colorClass)}>{Math.round(watermarkOptions.opacity * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={watermarkOptions.opacity}
                  onChange={(e) => setWatermarkOptions({ opacity: parseFloat(e.target.value) })}
                  className={cn("w-full h-1.5 bg-bg-dark/60 rounded-lg appearance-none cursor-pointer", accentClass)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Rotation</label>
                  <span className={cn("text-xs font-mono", colorClass)}>{watermarkOptions.rotation}°</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={watermarkOptions.rotation}
                  onChange={(e) => setWatermarkOptions({ rotation: parseInt(e.target.value) })}
                  className={cn("w-full h-1.5 bg-bg-dark/60 rounded-lg appearance-none cursor-pointer", accentClass)}
                />
              </div>
            </div>

            <WatermarkPreviewPanel file={files[0]} options={watermarkOptions} />
          </div>
        );
      case 'addPageNumbers':
        return (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
                <LayoutGrid className={cn("w-5 h-5", colorClass)} />
                <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Position</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPageNumberOptions({ position: pos })}
                    className={cn(
                      "h-10 rounded-lg border-2 transition-all flex items-center justify-center",
                      pageNumberOptions.position === pos
                        ? cn("bg-brand-primary/10", activeTool === 'addPageNumbers' ? "border-brand-primary" : "border-brand-primary")
                        : "border-border-glass bg-bg-dark/20 hover:border-brand-primary/30"
                    )}
                    title={pos.replace('-', ' ')}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      pageNumberOptions.position === pos ? getToolColorBg(activeTool) : "bg-text-secondary/40"
                    )} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
                <ScanText className={cn("w-5 h-5", colorClass)} />
                <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Formatting</h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Text Template</label>
                <input 
                  type="text"
                  value={pageNumberOptions.format}
                  onChange={(e) => setPageNumberOptions({ format: e.target.value })}
                  className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary placeholder:text-text-secondary/40 focus:border-brand-primary/50 outline-none transition-all text-sm font-mono"
                  placeholder="e.g. Page {n} of {total}"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
                <Settings className={cn("w-5 h-5", colorClass)} />
                <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Typography</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Font Family</label>
                  <select
                    value={pageNumberOptions.font}
                    onChange={(e) => setPageNumberOptions({ font: e.target.value as PageNumberFont })}
                    className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary focus:border-brand-primary/50 outline-none transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="helvetica">Helvetica (Standard)</option>
                    <option value="times-roman">Times Roman</option>
                    <option value="courier">Courier</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      case 'crop':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Crop className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Crop Bounds</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(['x', 'y', 'width', 'height'] as const).map((field) => (
                <div key={field} className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">
                    {field}
                  </label>
                  <input
                    type="number"
                    min={field === 'width' || field === 'height' ? 1 : 0}
                    value={cropBox[field]}
                    onChange={(event) => setCropBox({ [field]: Number(event.target.value) })}
                    className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary focus:border-brand-primary/50 outline-none transition-all text-sm"
                  />
                </div>
              ))}
            </div>
            <CropPreviewPanel file={files[0]} cropBox={cropBox} />
          </div>
        );
      case 'edit': {
        const annotation = editAnnotations[0];

        if (!annotation || annotation.type !== 'text') {
          return (
            <div className="flex flex-col items-center justify-center p-12 text-center gap-4 opacity-40">
              <PencilLine className="w-12 h-12 text-text-secondary" />
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Canvas Editor Ready</p>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <PencilLine className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Text Annotation</h3>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Text</label>
              <input
                type="text"
                value={annotation.text}
                onChange={(event) => setEditAnnotations([{ ...annotation, text: event.target.value }])}
                className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary focus:border-brand-primary/50 outline-none transition-all text-sm"
              />
            </div>
          </div>
        );
      }
      case 'forms': {
        const field = formFillOptions.fields[0] ?? { name: '', value: '' };

        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <FilePenLine className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Form Field</h3>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Field Name</label>
              <input
                type="text"
                value={field.name}
                onChange={(event) => setFormFillOptions({ ...formFillOptions, fields: [{ ...field, name: event.target.value }] })}
                className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary focus:border-brand-primary/50 outline-none transition-all text-sm"
              />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-border-glass bg-bg-dark/20 p-4 text-sm font-bold text-text-primary">
              <input
                type="checkbox"
                checked={formFillOptions.flatten}
                onChange={(event) => setFormFillOptions({ ...formFillOptions, flatten: event.target.checked })}
                className={cn("h-4 w-4", accentClass)}
              />
              Flatten fields into page content
            </label>
          </div>
        );
      }
      case 'jpgToPdf':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Images className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Page Layout</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Page Size</label>
                <div className="flex p-1 bg-bg-dark/40 rounded-xl border border-border-glass">
                  {(['image', 'a4'] as const).map((pageSize) => (
                    <button
                      key={pageSize}
                      onClick={() => setImageToPdfOptions({ pageSize })}
                      className={cn(
                        "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                        imageToPdfOptions.pageSize === pageSize
                          ? cn(getToolColorBg(activeTool), "text-white shadow-lg shadow-cyan-500/20")
                          : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      {pageSize === 'image' ? 'Image Size' : 'A4 Fit'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'wordToPdf':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <FilePenLine className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Document Layout</h3>
            </div>
            
            <div className="p-6 rounded-2xl bg-bg-dark/40 border-2 border-border-glass flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Settings className="w-8 h-8 text-blue-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-text-primary uppercase tracking-widest">Auto-Detection Active</p>
                <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight">
                  Our engine will automatically parse your DOCX structure, preserving margins, headings, and formatting.
                </p>
              </div>
            </div>
          </div>
        );
      case 'powerPointToPdf':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Images className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Slide Processing</h3>
            </div>
            
            <div className="p-6 rounded-2xl bg-bg-dark/40 border-2 border-border-glass flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Settings className="w-8 h-8 text-orange-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-text-primary uppercase tracking-widest">Landscape Rendering</p>
                <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight">
                  PPTX slides are extracted and compiled into high-resolution landscape PDF pages.
                </p>
              </div>
            </div>
          </div>
        );
      case 'excelToPdf':
        return <ExcelConfig />;
      case 'repair':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Wrench className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Repair Engine</h3>
            </div>
            
            <div className="p-6 rounded-2xl bg-bg-dark/40 border-2 border-border-glass flex flex-col items-center text-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-bg-dark border-2 border-brand-primary flex items-center justify-center">
                  <Zap className="w-10 h-10 text-brand-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center border-2 border-bg-dark">
                  <ShieldCheck className="w-3 h-3 text-bg-dark" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'htmlToPdf':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Settings className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">HTML Rendering</h3>
            </div>
          </div>
        );
      case 'pdfToJpg':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Settings className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">JPG Export</h3>
            </div>
          </div>
        );
      case 'pdfToWord':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <FileText className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Word Export</h3>
            </div>
            
            <div className="p-6 rounded-2xl bg-bg-dark/40 border-2 border-border-glass flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            </div>
          </div>
        );
      case 'pdfToPowerPoint':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Presentation className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">PowerPoint Export</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Slide Layout</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '16x9', label: 'Widescreen (16:9)', icon: Monitor },
                    { id: '4x3', label: 'Standard (4:3)', icon: MonitorPlay },
                  ].map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setPdfToPowerPointOptions({ layout: layout.id as '16x9' | '4x3' })}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-300",
                        pdfToPowerPointOptions.layout === layout.id
                          ? "bg-orange-500/10 border-orange-500 text-orange-500"
                          : "bg-bg-dark/40 border-border-glass text-text-secondary hover:border-orange-500/50"
                      )}
                    >
                      <layout.icon className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">{layout.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'pdfToExcel':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Table2 className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Excel Export</h3>
            </div>
          </div>
        );
      case 'compress':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Minimize2 className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Compression Level</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {COMPRESSION_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setCompressionTier(tier.id)}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 text-left",
                    compressionTier === tier.id 
                      ? "border-brand-primary bg-brand-primary/5 shadow-[0_0_15px_hsla(354,76%,49%,0.1)]" 
                      : "border-border-glass hover:border-brand-primary/30 bg-bg-dark/20"
                  )}
                >
                  <span className={cn("font-bold text-sm", compressionTier === tier.id ? "text-brand-primary" : "text-text-primary")}>
                    {tier.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'split':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Scissors className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Split Range</h3>
            </div>
          </div>
        );
      case 'protect':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Shield className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Security Options</h3>
            </div>
          </div>
        );
      case 'unlock':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Unlock className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Unlock Password</h3>
            </div>
          </div>
        );
      case 'ocr':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <ScanText className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">OCR Language</h3>
            </div>
          </div>
        );
      case 'pdfToPdfA':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Archive className={cn("w-5 h-5", colorClass)} />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">PDF/A Archiving</h3>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center gap-4 opacity-40">
            <Settings className="w-12 h-12 text-text-secondary" />
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Auto Configuration</p>
          </div>
        );
    }
  };

  const isProcessing = status === 'reading' || status === 'processing';
  const hasFiles = files.length > 0;
  const showConversionModePanel = CONVERSION_TOOLS.has(activeTool);
  const conversionModeRequired = showConversionModePanel && !conversionMode;

  return (
    <aside className="w-full lg:w-80 flex flex-col gap-8 p-6 rounded-2xl border border-border-glass bg-bg-card/30 backdrop-blur-xl shadow-2xl h-fit lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] opacity-80">
          Tools / {activeTool}
        </h2>
        <div className={cn(
          "w-2 h-2 rounded-full",
          isProcessing ? "bg-amber-500 animate-pulse shadow-[0_0_10px_#f59e0b]" : hasFiles ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-text-secondary/30"
        )} />
      </div>

      <div className="flex-1 min-h-[200px]">
        {showConversionModePanel && (
          <div className="mb-6">
            <ConversionModePanel
              activeTool={activeTool}
              conversionMode={conversionMode}
              conversionServiceConfirmed={conversionServiceConfirmed}
              setConversionMode={setConversionMode}
              setConversionServiceConfirmed={setConversionServiceConfirmed}
            />
          </div>
        )}
        {renderToolConfigs()}
      </div>

      <div className="flex flex-col gap-3">
        <button
          disabled={!hasFiles || isProcessing || conversionModeRequired}
          onClick={() => executeTool()}
          className={cn(
            "w-full group relative py-5 rounded-xl font-outfit font-black text-sm uppercase tracking-[0.2em] transition-all duration-300",
            "overflow-hidden flex items-center justify-center gap-3 shadow-xl",
            hasFiles && !isProcessing && !conversionModeRequired
              ? cn(getToolColorBg(activeTool), "text-white hover:scale-[1.02]", getToolColorShadow(activeTool))
              : "bg-white/5 text-text-secondary cursor-not-allowed border border-border-glass"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>{conversionModeRequired ? 'Choose Mode' : `Execute ${activeTool}`}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        {!hasFiles && (
          <p className={cn("text-center text-[10px] font-black uppercase tracking-widest animate-bounce", getToolColor(activeTool))}>
            Upload files to begin
          </p>
        )}
      </div>
    </aside>
  );
};
