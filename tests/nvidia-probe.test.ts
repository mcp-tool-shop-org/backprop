import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('child_process', () => {
  return {
    execFile: vi.fn(),
  };
});

describe('NVIDIA SMI Probe', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('parses single GPU output', async () => {
    const { execFile } = await import('child_process');
    const mockExecFile = vi.mocked(execFile);

    mockExecFile.mockImplementation(((cmd: string, args: string[], opts: any, cb?: Function) => {
      if (typeof opts === 'function') { cb = opts; }
      const stdout = '2048, 14336, 62, 45\n';
      if (cb) cb(null, { stdout, stderr: '' });
    }) as any);

    const { probeNvidiaSmi } = await import('../src/governor/probes/nvidiaSmiProbe.js');
    const result = await probeNvidiaSmi();

    expect(result).not.toBeNull();
    expect(result!.vramUsedMB).toBe(2048);
    expect(result!.vramFreeMB).toBe(14336);
    expect(result!.temperatureC).toBe(62);
    expect(result!.utilizationPercent).toBe(45);
  });

  it('picks GPU with most free VRAM for multi-GPU', async () => {
    const { execFile } = await import('child_process');
    const mockExecFile = vi.mocked(execFile);

    mockExecFile.mockImplementation(((cmd: string, args: string[], opts: any, cb?: Function) => {
      if (typeof opts === 'function') { cb = opts; }
      // GPU 0 has 4GB free, GPU 1 has 12GB free
      const stdout = '12288, 4096, 70, 90\n4096, 12288, 55, 30\n';
      if (cb) cb(null, { stdout, stderr: '' });
    }) as any);

    const { probeNvidiaSmi } = await import('../src/governor/probes/nvidiaSmiProbe.js');
    const result = await probeNvidiaSmi();

    expect(result).not.toBeNull();
    expect(result!.vramFreeMB).toBe(12288); // picked the one with more free VRAM
    expect(result!.temperatureC).toBe(55);
  });

  it('returns null when nvidia-smi not found', async () => {
    const { execFile } = await import('child_process');
    const mockExecFile = vi.mocked(execFile);

    mockExecFile.mockImplementation(((cmd: string, args: string[], opts: any, cb?: Function) => {
      if (typeof opts === 'function') { cb = opts; }
      const err: any = new Error('ENOENT');
      err.code = 'ENOENT';
      if (cb) cb(err, { stdout: '', stderr: '' });
    }) as any);

    const { probeNvidiaSmi } = await import('../src/governor/probes/nvidiaSmiProbe.js');
    const result = await probeNvidiaSmi();
    expect(result).toBeNull();
  });

  it('returns null for empty output', async () => {
    const { execFile } = await import('child_process');
    const mockExecFile = vi.mocked(execFile);

    mockExecFile.mockImplementation(((cmd: string, args: string[], opts: any, cb?: Function) => {
      if (typeof opts === 'function') { cb = opts; }
      if (cb) cb(null, { stdout: '', stderr: '' });
    }) as any);

    const { probeNvidiaSmi } = await import('../src/governor/probes/nvidiaSmiProbe.js');
    const result = await probeNvidiaSmi();
    expect(result).toBeNull();
  });

  it('skips lines with NaN values', async () => {
    const { execFile } = await import('child_process');
    const mockExecFile = vi.mocked(execFile);

    mockExecFile.mockImplementation(((cmd: string, args: string[], opts: any, cb?: Function) => {
      if (typeof opts === 'function') { cb = opts; }
      // First GPU has bad data, second is valid
      const stdout = 'N/A, N/A, N/A, N/A\n4096, 12288, 55, 30\n';
      if (cb) cb(null, { stdout, stderr: '' });
    }) as any);

    const { probeNvidiaSmi } = await import('../src/governor/probes/nvidiaSmiProbe.js');
    const result = await probeNvidiaSmi();

    expect(result).not.toBeNull();
    expect(result!.vramFreeMB).toBe(12288);
  });

  it('returns null when all lines have bad data', async () => {
    const { execFile } = await import('child_process');
    const mockExecFile = vi.mocked(execFile);

    mockExecFile.mockImplementation(((cmd: string, args: string[], opts: any, cb?: Function) => {
      if (typeof opts === 'function') { cb = opts; }
      const stdout = 'N/A, N/A, N/A, N/A\n';
      if (cb) cb(null, { stdout, stderr: '' });
    }) as any);

    const { probeNvidiaSmi } = await import('../src/governor/probes/nvidiaSmiProbe.js');
    const result = await probeNvidiaSmi();
    expect(result).toBeNull();
  });
});
