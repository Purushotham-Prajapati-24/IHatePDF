export type CompressionTier = 'extreme' | 'recommended' | 'low';

export interface CompressionSettings {
  dpi: number;
  jpegQuality: number;
}

export const COMPRESSION_SETTINGS: Record<CompressionTier, CompressionSettings> = {
  extreme: {
    dpi: 72,
    jpegQuality: 0.62,
  },
  recommended: {
    dpi: 150,
    jpegQuality: 0.76,
  },
  low: {
    dpi: 220,
    jpegQuality: 0.86,
  },
};

export function getCompressionSettings(tier: CompressionTier = 'recommended'): CompressionSettings {
  return COMPRESSION_SETTINGS[tier] ?? COMPRESSION_SETTINGS.recommended;
}

export function calculateRasterScale(dpi: number): number {
  return dpi / 72;
}
