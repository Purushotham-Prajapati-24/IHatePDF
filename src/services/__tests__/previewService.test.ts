import { describe, expect, it, vi } from 'vitest';
import { revokePreviewUrls } from '../previewService';

describe('previewService', () => {
  it('revokes only object URLs and leaves data URLs untouched', () => {
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    revokePreviewUrls(['blob:http://localhost/preview-1', 'data:image/png;base64,abc']);

    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/preview-1');
    revokeObjectURL.mockRestore();
  });
});
