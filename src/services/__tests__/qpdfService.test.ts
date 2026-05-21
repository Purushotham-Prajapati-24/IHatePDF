import { beforeEach, describe, expect, it, vi } from 'vitest';
import { protectPdfWithPassword, unlockPdfWithPassword } from '../qpdfService';

const writeFile = vi.fn();
const readFile = vi.fn(() => new Uint8Array([37, 80, 68, 70]));
const unlink = vi.fn();
const callMain = vi.fn();
const createModule = vi.fn(async () => ({
  FS: { writeFile, readFile, unlink },
  callMain,
}));

vi.mock('qpdf-wasm-esm-embedded', () => ({
  default: createModule,
}));

describe('qpdfService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readFile.mockReturnValue(new Uint8Array([37, 80, 68, 70]));
  });

  it('constructs the AES-256 protect command and cleans virtual files', async () => {
    const output = await protectPdfWithPassword(new Uint8Array([1, 2, 3]).buffer, 'secret');

    expect(new Uint8Array(output)).toEqual(new Uint8Array([37, 80, 68, 70]));
    expect(writeFile).toHaveBeenCalledOnce();
    expect(callMain).toHaveBeenCalledOnce();

    const args = callMain.mock.calls[0][0] as string[];
    expect(args.slice(0, 5)).toEqual(['--encrypt', 'secret', 'secret', '256', '--']);
    expect(args[5]).toMatch(/^\/input-/);
    expect(args[6]).toMatch(/^\/output-/);
    expect(unlink).toHaveBeenCalledTimes(2);
  });

  it('constructs the password decrypt command and cleans virtual files', async () => {
    await unlockPdfWithPassword(new Uint8Array([1, 2, 3]).buffer, 'secret');

    const args = callMain.mock.calls[0][0] as string[];
    expect(args[0]).toBe('--password=secret');
    expect(args[1]).toBe('--decrypt');
    expect(args[2]).toMatch(/^\/input-/);
    expect(args[3]).toMatch(/^\/output-/);
    expect(unlink).toHaveBeenCalledTimes(2);
  });

  it('wraps QPDF failures with an unlock-specific message', async () => {
    callMain.mockImplementationOnce(() => {
      throw new Error('invalid password');
    });

    await expect(unlockPdfWithPassword(new Uint8Array([1]).buffer, 'wrong')).rejects.toThrow(
      'Unable to unlock this PDF',
    );
    expect(unlink).toHaveBeenCalledTimes(2);
  });
});
