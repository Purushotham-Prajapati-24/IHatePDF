/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SuccessScreen } from '../SuccessScreen';
import { useFileStore } from '../../../store/useFileStore';
import { downloadBlob } from '../../../utils/downloadBlob';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('../../../utils/downloadBlob', () => ({
  downloadBlob: vi.fn(),
}));

describe('SuccessScreen', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:processed-output'),
      revokeObjectURL: vi.fn(),
    });

    useFileStore.setState({
      status: 'success',
      processedBlob: new Blob(['%PDF-test'], { type: 'application/pdf' }),
      processedFileName: 'result.pdf',
      processedNotice: null,
      processedEngine: 'browser',
      donationStats: {
        totalTasksCompleted: 1,
        lastDonationPromptTimestamp: null,
        hasDonated: false,
        totalTimeSavedSeconds: 0,
        totalBandwidthSavedBytes: 0,
      },
      isDonationModalOpen: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders a persistent browser-native download link for processed output', async () => {
    render(
      <MemoryRouter>
        <SuccessScreen />
      </MemoryRouter>,
    );

    const downloadLink = await screen.findByRole('link', { name: 'Download result.pdf' });
    await waitFor(() => expect(downloadLink.getAttribute('href')).toBe('blob:processed-output'));
    expect(downloadLink.getAttribute('download')).toBe('result.pdf');
    expect(screen.getByText('result.pdf')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open result.pdf in a new tab' }).getAttribute('href')).toBe('blob:processed-output');
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'result.pdf');
  });
});
