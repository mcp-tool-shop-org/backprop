import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('child_process', () => {
  return {
    execFile: vi.fn()
  };
});

describe('ROCm Probe', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('should parse rocm-smi CSV output', async () => {
    const { execFile } = await import('child_process');
    const mockExecFile = vi.mocked(execFile);

    mockExecFile.mockImplementation(((cmd: string, args: string[], opts: any, cb?: Function) => {
      if (typeof opts === 'function') { cb = opts; }
      const stdout = [
        'device,vram Total Memory (B),vram Total Used Memory (B),Temperature (Sensor edge) (C),GPU use (%)',
        '0,17179869184,4294967296,55,30'
      ].join('\n');
      if (cb) cb(null, { stdout, stderr: '' });
    }) as any);

    const { probeRocmSmi } = await import('../src/governor/probes/rocmProbe.js');
    const result = await probeRocmSmi();

    expect(result).not.toBeNull();
    expect(result!.vramFreeMB).toBe(12288); // 16384 - 4096
    expect(result!.vramUsedMB).toBe(4096);
    expect(result!.temperatureC).toBe(55);
    expect(result!.utilizationPercent).toBe(30);
  });

  it('should return null if rocm-smi is not found', async () => {
    const { execFile } = await import('child_process');
    const mockExecFile = vi.mocked(execFile);

    mockExecFile.mockImplementation(((cmd: string, args: string[], opts: any, cb?: Function) => {
      if (typeof opts === 'function') { cb = opts; }
      const err: any = new Error('ENOENT');
      err.code = 'ENOENT';
      if (cb) cb(err, { stdout: '', stderr: '' });
    }) as any);

    const { probeRocmSmi } = await import('../src/governor/probes/rocmProbe.js');
    const result = await probeRocmSmi();
    expect(result).toBeNull();
  });

  it('should return null for empty output', async () => {
    const { execFile } = await import('child_process');
    const mockExecFile = vi.mocked(execFile);

    mockExecFile.mockImplementation(((cmd: string, args: string[], opts: any, cb?: Function) => {
      if (typeof opts === 'function') { cb = opts; }
      if (cb) cb(null, { stdout: '', stderr: '' });
    }) as any);

    const { probeRocmSmi } = await import('../src/governor/probes/rocmProbe.js');
    const result = await probeRocmSmi();
    expect(result).toBeNull();
  });
});
