import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../src/governor/probes/nvidiaSmiProbe.js', () => ({
  probeNvidiaSmi: vi.fn(),
}));

vi.mock('../src/governor/probes/rocmProbe.js', () => ({
  probeRocmSmi: vi.fn(),
}));

import { getGpuProbe } from '../src/governor/probes/index.js';
import { probeNvidiaSmi } from '../src/governor/probes/nvidiaSmiProbe.js';
import { probeRocmSmi } from '../src/governor/probes/rocmProbe.js';

describe('getGpuProbe', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns nulls for none probe type', async () => {
    const result = await getGpuProbe('none');
    expect(result).toEqual({
      vramFreeMB: null,
      temperatureC: null,
      utilizationPercent: null,
    });
    expect(probeNvidiaSmi).not.toHaveBeenCalled();
    expect(probeRocmSmi).not.toHaveBeenCalled();
  });

  it('returns nvidia data for nvidia-smi probe type', async () => {
    vi.mocked(probeNvidiaSmi).mockResolvedValue({
      vramUsedMB: 2000,
      vramFreeMB: 14000,
      temperatureC: 60,
      utilizationPercent: 50,
    });

    const result = await getGpuProbe('nvidia-smi');
    expect(probeNvidiaSmi).toHaveBeenCalled();
    expect(result.vramFreeMB).toBe(14000);
    expect(result.temperatureC).toBe(60);
  });

  it('returns rocm data for rocm probe type', async () => {
    vi.mocked(probeRocmSmi).mockResolvedValue({
      vramUsedMB: 3000,
      vramFreeMB: 13000,
      temperatureC: 55,
      utilizationPercent: 40,
    });

    const result = await getGpuProbe('rocm');
    expect(probeRocmSmi).toHaveBeenCalled();
    expect(result.vramFreeMB).toBe(13000);
    expect(result.temperatureC).toBe(55);
  });

  it('falls back to nulls when rocm probe returns null', async () => {
    vi.mocked(probeRocmSmi).mockResolvedValue(null);

    const result = await getGpuProbe('rocm');
    expect(result).toEqual({
      vramFreeMB: null,
      temperatureC: null,
      utilizationPercent: null,
    });
  });

  it('auto: tries nvidia first', async () => {
    vi.mocked(probeNvidiaSmi).mockResolvedValue({
      vramUsedMB: 1000,
      vramFreeMB: 15000,
      temperatureC: 50,
      utilizationPercent: 20,
    });

    const result = await getGpuProbe('auto');
    expect(probeNvidiaSmi).toHaveBeenCalled();
    expect(probeRocmSmi).not.toHaveBeenCalled();
    expect(result.vramFreeMB).toBe(15000);
  });

  it('auto: falls back to rocm if nvidia fails', async () => {
    vi.mocked(probeNvidiaSmi).mockResolvedValue(null);
    vi.mocked(probeRocmSmi).mockResolvedValue({
      vramUsedMB: 2000,
      vramFreeMB: 14000,
      temperatureC: 58,
      utilizationPercent: 35,
    });

    const result = await getGpuProbe('auto');
    expect(probeNvidiaSmi).toHaveBeenCalled();
    expect(probeRocmSmi).toHaveBeenCalled();
    expect(result.vramFreeMB).toBe(14000);
  });

  it('auto: returns nulls if both probes fail', async () => {
    vi.mocked(probeNvidiaSmi).mockResolvedValue(null);
    vi.mocked(probeRocmSmi).mockResolvedValue(null);

    const result = await getGpuProbe('auto');
    expect(result).toEqual({
      vramFreeMB: null,
      temperatureC: null,
      utilizationPercent: null,
    });
  });

  it('defaults to auto when no probe type specified', async () => {
    vi.mocked(probeNvidiaSmi).mockResolvedValue(null);
    vi.mocked(probeRocmSmi).mockResolvedValue(null);

    const result = await getGpuProbe();
    expect(probeNvidiaSmi).toHaveBeenCalled();
    expect(probeRocmSmi).toHaveBeenCalled();
    expect(result.vramFreeMB).toBeNull();
  });
});
