import React from 'react';
import { useFileStore } from '../../store/useFileStore';
import { Settings, Shield, Scissors, Minimize2, ArrowRight, Loader2, ScanText, Unlock } from 'lucide-react';
import { cn } from '../layout/Navbar';

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
    setCompressionTier,
    setSplitRangeInput,
    setOcrLanguage,
    setProtectPassword,
    setProtectConfirmPassword,
    setUnlockPassword,
  } = useFileStore();

  if (!activeTool) return null;

  const renderToolConfigs = () => {
    switch (activeTool) {
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
