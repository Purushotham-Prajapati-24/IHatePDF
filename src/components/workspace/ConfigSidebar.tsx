import React, { useEffect, useState } from 'react';
import { useFileStore } from '../../store/useFileStore';
import { Settings, Shield, Scissors, Minimize2, ArrowRight, Loader2, ScanText, Unlock, LayoutGrid, Stamp, Crop, ImageIcon as Image, PencilLine, FilePenLine, Images, ListChecks, FileText, Presentation, Table2, Monitor, MonitorPlay, Check, Type, ChevronDown, ShieldCheck, Archive, Wrench, Zap } from 'lucide-react';
import { cn } from '../layout/Navbar';
import type { PageNumberFont } from '../../services/pdfOperations';
import { getExcelSheetNames } from '../../services/pdfService';
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
        <ListChecks className="w-5 h-5 text-brand-primary" />
        <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Select Sheets</h3>
      </div>

      <div className="space-y-4">
        <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
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
                    ? "border-brand-primary bg-brand-primary/5 text-text-primary shadow-lg shadow-brand-primary/10"
                    : "border-border-glass bg-bg-dark/20 text-text-secondary hover:border-brand-primary/30"
                )}
              >
                <span className="text-xs font-bold truncate max-w-[180px]">{name}</span>
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                  excelToPdfOptions.selectedSheets.includes(name)
                    ? "border-brand-primary bg-brand-primary"
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
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
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
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
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
    switch (activeTool) {
      case 'addWatermark':
        return (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
                <Settings className="w-5 h-5 text-brand-primary" />
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
                        ? "bg-brand-primary text-white shadow-lg"
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
                      className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary placeholder:text-text-secondary/40 focus:border-brand-primary/50 outline-none transition-all text-sm"
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
                    <div className="w-full p-8 rounded-xl border-2 border-dashed border-border-glass bg-bg-dark/20 group-hover:border-brand-primary/50 transition-all flex flex-col items-center gap-2 text-center">
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
                    className="w-full accent-brand-primary h-1.5 bg-bg-dark/60 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="block text-right text-xs font-mono text-brand-primary">{watermarkOptions.size}%</span>
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
                  <span className="text-xs font-mono text-brand-primary">{Math.round(watermarkOptions.opacity * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={watermarkOptions.opacity}
                  onChange={(e) => setWatermarkOptions({ opacity: parseFloat(e.target.value) })}
                  className="w-full accent-brand-primary h-1.5 bg-bg-dark/60 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Rotation</label>
                  <span className="text-xs font-mono text-brand-primary">{watermarkOptions.rotation}°</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={watermarkOptions.rotation}
                  onChange={(e) => setWatermarkOptions({ rotation: parseInt(e.target.value) })}
                  className="w-full accent-brand-primary h-1.5 bg-bg-dark/60 rounded-lg appearance-none cursor-pointer"
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
                <LayoutGrid className="w-5 h-5 text-brand-primary" />
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
                        ? "border-brand-primary bg-brand-primary/10"
                        : "border-border-glass bg-bg-dark/20 hover:border-brand-primary/30"
                    )}
                    title={pos.replace('-', ' ')}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      pageNumberOptions.position === pos ? "bg-brand-primary" : "bg-text-secondary/40"
                    )} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
                <ScanText className="w-5 h-5 text-brand-primary" />
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
                <p className="text-[10px] text-text-secondary/60 leading-relaxed italic">
                  Use {'{n}'} for page number and {'{total}'} for total pages.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
                <Settings className="w-5 h-5 text-brand-primary" />
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Font Size</label>
                    <input 
                      type="number"
                      min={6}
                      max={72}
                      value={pageNumberOptions.size}
                      onChange={(e) => setPageNumberOptions({ size: parseInt(e.target.value) || 12 })}
                      className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary focus:border-brand-primary/50 outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Color (Hex)</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={pageNumberOptions.color}
                        onChange={(e) => setPageNumberOptions({ color: e.target.value })}
                        className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary focus:border-brand-primary/50 outline-none transition-all text-sm font-mono"
                      />
                      <div 
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md border border-white/10 shadow-sm"
                        style={{ backgroundColor: pageNumberOptions.color }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'crop':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Crop className="w-5 h-5 text-brand-primary" />
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
              <PencilLine className="w-5 h-5 text-brand-primary" />
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
            <div className="grid grid-cols-2 gap-4">
              {(['x', 'y', 'size'] as const).map((field) => (
                <div key={field} className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">{field}</label>
                  <input
                    type="number"
                    min={field === 'size' ? 1 : 0}
                    value={annotation[field]}
                    onChange={(event) => setEditAnnotations([{ ...annotation, [field]: Number(event.target.value) }])}
                    className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary focus:border-brand-primary/50 outline-none transition-all text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Color</label>
              <input
                type="text"
                value={annotation.color}
                onChange={(event) => setEditAnnotations([{ ...annotation, color: event.target.value }])}
                className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary focus:border-brand-primary/50 outline-none transition-all text-sm font-mono"
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
              <FilePenLine className="w-5 h-5 text-brand-primary" />
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
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Value</label>
              <input
                type="text"
                value={String(field.value)}
                onChange={(event) => setFormFillOptions({ ...formFillOptions, fields: [{ ...field, value: event.target.value }] })}
                className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary focus:border-brand-primary/50 outline-none transition-all text-sm"
              />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-border-glass bg-bg-dark/20 p-4 text-sm font-bold text-text-primary">
              <input
                type="checkbox"
                checked={formFillOptions.flatten}
                onChange={(event) => setFormFillOptions({ ...formFillOptions, flatten: event.target.checked })}
                className="h-4 w-4 accent-brand-primary"
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
              <Images className="w-5 h-5 text-brand-primary" />
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
                          ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                          : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      {pageSize === 'image' ? 'Image Size' : 'A4 Fit'}
                    </button>
                  ))}
                </div>
              </div>

              {imageToPdfOptions.pageSize === 'a4' && (
                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Orientation</label>
                  <div className="flex p-1 bg-bg-dark/40 rounded-xl border border-border-glass">
                    {(['portrait', 'landscape'] as const).map((orientation) => (
                      <button
                        key={orientation}
                        onClick={() => setImageToPdfOptions({ orientation })}
                        className={cn(
                          "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                          imageToPdfOptions.orientation === orientation
                            ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                            : "text-text-secondary hover:text-text-primary"
                        )}
                      >
                        {orientation}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Margin</label>
                  <span className="text-[10px] font-mono text-brand-primary">{imageToPdfOptions.margin}pt</span>
                </div>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={imageToPdfOptions.margin}
                  disabled={imageToPdfOptions.pageSize === 'image'}
                  onChange={(event) => setImageToPdfOptions({ margin: Number(event.target.value) })}
                  className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary disabled:opacity-20 focus:border-brand-primary/50 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/10">
              <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight">
                {imageToPdfOptions.pageSize === 'image' 
                  ? "Images will be embedded as full pages preserving their original dimensions and quality."
                  : `Images will be fitted onto ${imageToPdfOptions.orientation} A4 pages with centered alignment.`}
              </p>
            </div>
          </div>
        );
      case 'wordToPdf':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <FilePenLine className="w-5 h-5 text-brand-primary" />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Document Layout</h3>
            </div>
            
            <div className="p-6 rounded-2xl bg-bg-dark/40 border-2 border-border-glass flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <Settings className="w-8 h-8 text-brand-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-text-primary uppercase tracking-widest">Auto-Detection Active</p>
                <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight">
                  Our engine will automatically parse your DOCX structure, preserving margins, headings, and formatting.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/10">
              <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight italic">
                Tip: Complex tables and nested layouts are optimized for standard A4 output.
              </p>
            </div>
          </div>
        );
      case 'powerPointToPdf':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Images className="w-5 h-5 text-brand-primary" />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Slide Processing</h3>
            </div>
            
            <div className="p-6 rounded-2xl bg-bg-dark/40 border-2 border-border-glass flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <Settings className="w-8 h-8 text-brand-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-text-primary uppercase tracking-widest">Landscape Rendering</p>
                <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight">
                  PPTX slides are extracted and compiled into high-resolution landscape PDF pages.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/10">
              <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight italic">
                Note: Each slide becomes a single page. Animations and transitions are flattened.
              </p>
            </div>
          </div>
        );
      case 'excelToPdf':
        return <ExcelConfig />;
      case 'repair':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Wrench className="w-5 h-5 text-brand-primary" />
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

              <div className="space-y-2">
                <p className="text-xs font-black text-text-primary uppercase tracking-widest">Neural Reconstruction</p>
                <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight max-w-[200px]">
                  Our engine will sweep the binary stream to rebuild broken cross-reference tables and fix truncated trailers.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Binary Scan', active: true },
                { label: 'XREF Recovery', active: true },
                { label: 'Trailer Rebuild', active: true },
                { label: 'Catalog Validation', active: true },
              ].map((step, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-bg-dark/20 border border-border-glass/50">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-brand-primary uppercase">Ready</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'htmlToPdf':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Settings className="w-5 h-5 text-brand-primary" />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">HTML Rendering</h3>
            </div>
            <div className="p-6 rounded-2xl bg-bg-dark/40 border-2 border-border-glass text-center">
              <p className="text-xs font-black text-text-primary uppercase tracking-widest">Text and structure are auto-paginated</p>
            </div>
          </div>
        );
      case 'pdfToJpg':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Settings className="w-5 h-5 text-brand-primary" />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">JPG Export</h3>
            </div>
            <div className="p-6 rounded-2xl bg-bg-dark/40 border-2 border-border-glass text-center">
              <p className="text-xs font-black text-text-primary uppercase tracking-widest">Every page exports at 150 DPI</p>
            </div>
          </div>
        );
      case 'pdfToWord':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <FileText className="w-5 h-5 text-brand-primary" />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Word Export</h3>
            </div>
            
            <div className="p-6 rounded-2xl bg-bg-dark/40 border-2 border-border-glass flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-text-primary uppercase tracking-widest">Layout Analysis</p>
                <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight">
                  Analyzing spatial text bounds to reconstruct paragraphs and styles into DOCX format.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/10">
              <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight italic text-center">
                This process runs entirely in your browser. Large documents may take a few moments.
              </p>
            </div>
          </div>
        );
      case 'pdfToPowerPoint':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Presentation className="w-5 h-5 text-brand-primary" />
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
                          ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                          : "bg-bg-dark/40 border-border-glass text-text-secondary hover:border-brand-primary/50"
                      )}
                    >
                      <layout.icon className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">{layout.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Assets</label>
                <button
                  onClick={() => setPdfToPowerPointOptions({ includeImages: !pdfToPowerPointOptions.includeImages })}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300",
                    pdfToPowerPointOptions.includeImages
                      ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                      : "bg-bg-dark/40 border-border-glass text-text-secondary hover:border-brand-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Image className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Extract Images</span>
                  </div>
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                    pdfToPowerPointOptions.includeImages ? "bg-brand-primary border-brand-primary" : "border-text-secondary"
                  )}>
                    {pdfToPowerPointOptions.includeImages && <Check className="w-3 h-3 text-bg-dark" />}
                  </div>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Typography</label>
                <div className="relative group">
                  <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                  <select
                    value={pdfToPowerPointOptions.fontFace}
                    onChange={(e) => setPdfToPowerPointOptions({ fontFace: e.target.value })}
                    className="w-full bg-bg-dark/60 border-2 border-border-glass rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-text-primary focus:border-brand-primary outline-none appearance-none transition-all uppercase tracking-widest cursor-pointer"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Tahoma">Tahoma</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Garamond">Garamond</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none group-hover:text-brand-primary transition-colors" />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-bg-dark/40 border-2 border-border-glass flex items-start gap-4">
              <div className="mt-1">
                <ShieldCheck className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-text-primary uppercase tracking-widest">AI Mapping Active</p>
                <p className="text-[9px] text-text-secondary leading-relaxed uppercase tracking-tight">
                  Analyzing PDF layers to reconstruct editable PPTX elements.
                </p>
              </div>
            </div>
          </div>
        );
      case 'pdfToExcel':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Table2 className="w-5 h-5 text-brand-primary" />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Excel Export</h3>
            </div>
            
            <div className="p-6 rounded-2xl bg-bg-dark/40 border-2 border-border-glass flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <LayoutGrid className="w-8 h-8 text-brand-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-text-primary uppercase tracking-widest">Table Detection</p>
                <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight">
                  Identifying tabular structures and aligning data into XLSX rows and columns.
                </p>
              </div>
            </div>
          </div>
        );
      case 'compress':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Minimize2 className="w-5 h-5 text-brand-primary" />
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
                  <span className="text-[10px] text-text-secondary mt-1 uppercase font-black tracking-tighter opacity-60">
                    {tier.sub} - {tier.dpi}
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
              <Scissors className="w-5 h-5 text-brand-primary" />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Split Range</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Custom Range</label>
                <input 
                  type="text"
                  placeholder="e.g. 1-5, 8, 11-15"
                  value={splitRangeInput}
                  onChange={(e) => setSplitRangeInput(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary placeholder:text-text-secondary/40 focus:border-brand-primary/50 outline-none transition-all text-sm font-mono"
                />
              </div>
              <p className="text-[11px] text-text-secondary/60 italic leading-relaxed">
                Use commas for multiple ranges. Leave empty to split every page.
              </p>
            </div>
          </div>
        );
      case 'protect':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Shield className="w-5 h-5 text-brand-primary" />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Security Options</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Set Password</label>
                <input 
                  type="password"
                  placeholder="Strong password..."
                  value={protectPassword}
                  onChange={(e) => setProtectPassword(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary placeholder:text-text-secondary/40 focus:border-brand-primary/50 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Confirm Password</label>
                <input 
                  type="password"
                  placeholder="Repeat password..."
                  value={protectConfirmPassword}
                  onChange={(e) => setProtectConfirmPassword(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary placeholder:text-text-secondary/40 focus:border-brand-primary/50 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        );
      case 'unlock':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Unlock className="w-5 h-5 text-brand-primary" />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">Unlock Password</h3>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Current Password</label>
              <input 
                type="password"
                placeholder="PDF password..."
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary placeholder:text-text-secondary/40 focus:border-brand-primary/50 outline-none transition-all"
              />
            </div>
          </div>
        );
      case 'ocr':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <ScanText className="w-5 h-5 text-brand-primary" />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">OCR Language</h3>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Language Code</label>
              <input 
                type="text"
                value={ocrLanguage}
                onChange={(e) => setOcrLanguage(e.target.value.trim() || 'eng')}
                className="w-full p-4 rounded-xl border-2 border-border-glass bg-bg-dark/40 text-text-primary placeholder:text-text-secondary/40 focus:border-brand-primary/50 outline-none transition-all font-mono"
              />
            </div>
          </div>
        );
      case 'pdfToPdfA':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-glass pb-4">
              <Archive className="w-5 h-5 text-brand-primary" />
              <h3 className="font-outfit font-bold uppercase text-sm tracking-widest">PDF/A Archiving</h3>
            </div>
            
            <div className="p-6 rounded-2xl bg-bg-dark/40 border-2 border-border-glass flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-brand-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-text-primary uppercase tracking-widest">ISO 19005 Compliance</p>
                <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight">
                  Injecting XMP metadata and color profiles for long-term digital preservation.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Conformance Level</label>
              <div className="bg-bg-dark/60 border-2 border-border-glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-widest">PDF/A-1b</span>
                  <span className="text-[10px] font-black text-brand-primary uppercase bg-brand-primary/10 px-2 py-0.5 rounded">Active</span>
                </div>
                <p className="text-[9px] text-text-secondary uppercase tracking-tight leading-relaxed">
                  Basic level conformance ensuring reliable visual reproduction over time.
                </p>
              </div>
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

  return (
    <aside className="w-full lg:w-80 flex flex-col gap-8 p-6 rounded-2xl border border-border-glass bg-bg-card/30 backdrop-blur-2xl shadow-2xl h-fit lg:sticky lg:top-24">
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
        {renderToolConfigs()}
      </div>

      <div className="flex flex-col gap-3">
        <button
          disabled={!hasFiles || isProcessing}
          onClick={() => executeTool()}
          className={cn(
            "w-full group relative py-5 rounded-xl font-outfit font-black text-sm uppercase tracking-[0.2em] transition-all duration-300",
            "overflow-hidden flex items-center justify-center gap-3 shadow-xl",
            hasFiles && !isProcessing
              ? "bg-brand-primary text-white hover:scale-[1.02] hover:shadow-brand-primary/40 active:scale-95 active:brightness-90"
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
              <span>Execute {activeTool}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        {!hasFiles && (
          <p className="text-center text-[10px] text-brand-primary font-black uppercase tracking-widest animate-bounce">
            Upload files to begin
          </p>
        )}
      </div>
    </aside>
  );
};
