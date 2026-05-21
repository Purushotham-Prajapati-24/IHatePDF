import React from 'react';
import { Crop } from 'lucide-react';
import type { CropBox } from '../../services/pdfOperations';
import type { FileMetadata } from '../../types';
import { createCroppedImageStyle, createCropPreviewStyle } from '../../utils/pdfPreviewGeometry';

interface CropPreviewPanelProps {
  file?: FileMetadata;
  cropBox: CropBox;
}

export const CropPreviewPanel: React.FC<CropPreviewPanelProps> = ({ file, cropBox }) => {
  const previewUrl = file?.previewUrls?.[0];
  const pageSize = file?.pageSizes?.[0];

  if (!previewUrl || !pageSize) {
    return (
      <div className="rounded-2xl border border-border-glass bg-bg-dark/30 p-4 text-center">
        <Crop className="mx-auto mb-3 h-6 w-6 text-brand-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
          Crop preview appears after the page render is ready.
        </p>
      </div>
    );
  }

  const cropStyle = createCropPreviewStyle(cropBox, pageSize);
  const croppedImageStyle = createCroppedImageStyle(cropBox, pageSize);

  return (
    <div className="space-y-4 rounded-2xl border border-border-glass bg-bg-dark/25 p-4">
      <div className="flex items-center gap-2">
        <Crop className="h-4 w-4 text-brand-primary" />
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-primary">
          Crop Preview
        </h4>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-glass bg-white">
        <div className="relative">
          <img src={previewUrl} alt="Original page crop preview" className="block w-full" draggable={false} />
          <div className="absolute inset-0 bg-bg-dark/45" />
          <div
            className="absolute border-2 border-brand-primary bg-brand-primary/10 shadow-[0_0_24px_hsla(354,76%,49%,0.35)]"
            style={cropStyle}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-brand-primary/25 bg-white">
        <div
          className="relative overflow-hidden bg-white"
          style={{
            aspectRatio: `${cropBox.width || 1} / ${cropBox.height || 1}`,
          }}
          aria-label="Cropped content preview"
          role="img"
        >
          <img
            src={previewUrl}
            alt=""
            className="absolute max-w-none"
            draggable={false}
            style={croppedImageStyle}
          />
        </div>
      </div>
    </div>
  );
};
