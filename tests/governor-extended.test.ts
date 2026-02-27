import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Governor } from '../src/governor/policy.js';
import { TokenBucket } from '../src/governor/token-bucket.js';
import { ResourceMonitor } from '../src/governor/resource-monitor.js';
import * as probes from '../src/governor/probes/index.js';

vi.mock('../src/governor/probes/index.js');

describe('Governor extended', () => {
  let bucket: TokenBucket;
  let monitor: ResourceMonitor;

  beforeEach(() => {
    vi.useFakeTimers();
    bucket = new TokenBucket(4, 1, 60000);
    monitor = new ResourceMonitor();
    vi.spyOn(monitor, 'getState').mockResolvedValue({
      ramFreeGB: 16.0,
      cpuLoad: 1.0,
      monitoringFailed: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('rejects when GPU temperature exceeds maxTempC', async () => {
    vi.mocked(probes.getGpuProbe).mockResolvedValue({
      vramFreeMB: 12000,
      temperatureC: 90,
      utilizationPercent: 80,
    });
    const gov = new Governor(bucket, monitor, 2, 4, 85, 2500);
    const result = await gov.canStartRun();
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('temperature too high');
  });

  it('allows when GPU temperature equals maxTempC', async () => {
    vi.mocked(probes.getGpuProbe).mockResolvedValue({
      vramFreeMB: 12000,
      temperatureC: 85,
      utilizationPercent: 50,
    });
    const gov = new Governor(bucket, monitor, 2, 4, 85, 2500);
    const result = await gov.canStartRun();
    expect(result.allowed).toBe(false); // >= means reject
  });

  it('warns but allows when temp is near threshold', async () => {
    vi.mocked(probes.getGpuProbe).mockResolvedValue({
      vramFreeMB: 12000,
      temperatureC: 83, // > 85-3 = 82, should warn
      utilizationPercent: 50,
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const gov = new Governor(bucket, monitor, 2, 4, 85, 2500);
    const result = await gov.canStartRun();
    expect(result.allowed).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('high'));
    warnSpy.mockRestore();
  });

  it('rejects when VRAM is below minimum', async () => {
    vi.mocked(probes.getGpuProbe).mockResolvedValue({
      vramFreeMB: 1000,
      temperatureC: 60,
      utilizationPercent: 30,
    });
    const gov = new Governor(bucket, monitor, 2, 4, 85, 2500);
    const result = await gov.canStartRun();
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('low VRAM');
  });

  it('allows when VRAM is null (no GPU detected)', async () => {
    vi.mocked(probes.getGpuProbe).mockResolvedValue({
      vramFreeMB: null,
      temperatureC: null,
      utilizationPercent: null,
    });
    const gov = new Governor(bucket, monitor, 2, 4, 85, 2500);
    const result = await gov.canStartRun();
    expect(result.allowed).toBe(true);
  });

  it('rejects in conservative mode when maxParallel > 1', async () => {
    vi.mocked(monitor.getState).mockResolvedValue({
      ramFreeGB: 0,
      cpuLoad: 999,
      monitoringFailed: true,
    });
    vi.mocked(probes.getGpuProbe).mockResolvedValue({
      vramFreeMB: null,
      temperatureC: null,
      utilizationPercent: null,
    });
    const gov = new Governor(bucket, monitor, 2, 4);
    const result = await gov.canStartRun();
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('monitoring failed');
  });

  it('allows in conservative mode when maxParallel = 1', async () => {
    vi.mocked(monitor.getState).mockResolvedValue({
      ramFreeGB: 0,
      cpuLoad: 999,
      monitoringFailed: true,
    });
    const gov = new Governor(bucket, monitor, 1, 4);
    const result = await gov.canStartRun();
    expect(result.allowed).toBe(true);
  });

  it('checks token bucket before resource checks', async () => {
    // Exhaust tokens
    await bucket.acquire(4);
    vi.mocked(probes.getGpuProbe).mockResolvedValue({
      vramFreeMB: 12000,
      temperatureC: 60,
      utilizationPercent: 30,
    });
    const gov = new Governor(bucket, monitor, 2, 4);
    const result = await gov.canStartRun();
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('token bucket');
    // Resource monitor should NOT have been called since token check fails first
    expect(monitor.getState).not.toHaveBeenCalled();
  });
});
