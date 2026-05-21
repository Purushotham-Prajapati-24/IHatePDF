import React, { useEffect, useState } from 'react';
import { Stamp } from 'lucide-react';
import type { WatermarkOptions } from '../../services/pdfOperations';
import type { FileMetadata } from '../../types';

interface WatermarkPreviewPanelProps {
  file?: FileMetadata;
  options: WatermarkOptions;
}

export const WatermarkPreviewPanel: React.FC<WatermarkPreviewPanelProps> = ({ file, options }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const previewUrl = file?.previewUrls?.[0];

  useEffect(() => {
    if (options.type !== 'image' || !options.image) {
      setImageUrl(null);
      return;
    }

    const url = URL.createObjectURL(options.image);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [options.image, options.type]);

  if (!previewUrl) {
    return (
      <div className="rounded-2xl border border-border-glass bg-bg-dark/30 p-4 text-center">
        <Stamp className="mx-auto mb-3 h-6 w-6 text-brand-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
          Watermark preview appears after the page render is ready.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border-glass bg-bg-dark/25 p-4">
      <div className="flex items-center gap-2">
        <Stamp className="h-4 w-4 text-brand-primary" />
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-primary">
          Watermark Preview
        </h4>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-glass bg-white">
        <div className="relative">
          <img src={previewUrl} alt="Page watermark preview" className="block w-full" draggable={false} />
          <div className="absolute inset-0 grid place-items-center overflow-hidden">
            {options.type === 'image' && imageUrl ? (
              <img
                src={imageUrl}
                alt="Selected watermark"
                className="max-w-[90%] object-contain"
                draggable={false}
                style={{
                  width: `${Math.max(5, Math.min(90, options.size))}%`,
                  opacity: options.opacity,
                  transform: `rotate(${options.rotation}deg)`,
                }}
              />
            ) : (
              <span
                className="max-w-[90%] break-words text-center font-black uppercase leading-none"
                style={{
                  color: options.color,
                  fontFamily: getPreviewFont(options.font),
                  fontSize: `${Math.max(12, Math.min(72, options.size))}px`,
                  opacity: options.opacity,
                  transform: `rotate(${options.rotation}deg)`,
                }}
              >
                {options.text || 'Watermark'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getPreviewFont(font: WatermarkOptions['font']): string {
  if (font === 'times-roman') return 'Georgia, serif';
  if (font === 'courier') return '"Courier New", monospace';
  return 'Inter, Arial, sans-serif';
}
