import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock the os module at the top level for ESM compatibility
vi.mock('os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('os')>();
  return {
    ...actual,
    freemem: vi.fn(actual.freemem),
    loadavg: vi.fn(actual.loadavg),
    cpus: vi.fn(actual.cpus),
  };
});

import * as os from 'os';
import { ResourceMonitor } from '../src/governor/resource-monitor.js';

describe('ResourceMonitor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns RAM and CPU values', async () => {
    const monitor = new ResourceMonitor();
    const state = await monitor.getState();

    expect(typeof state.ramFreeGB).toBe('number');
    expect(state.ramFreeGB).toBeGreaterThan(0);
    expect(typeof state.cpuLoad).toBe('number');
    expect(state.cpuLoad).toBeGreaterThanOrEqual(0);
    expect(state.monitoringFailed).toBe(false);
  });

  it('returns monitoringFailed: true when os throws', async () => {
    vi.mocked(os.freemem).mockImplementation(() => {
      throw new Error('OS error');
    });

    const monitor = new ResourceMonitor();
    const state = await monitor.getState();

    expect(state.monitoringFailed).toBe(true);
    expect(state.ramFreeGB).toBe(0);
    expect(state.cpuLoad).toBe(999);
  });

  it('handles Windows CPU load approximation', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });

    vi.mocked(os.cpus).mockReturnValue([
      { model: 'test', speed: 3000, times: { user: 5000, nice: 0, sys: 2000, idle: 3000, irq: 0 } },
      { model: 'test', speed: 3000, times: { user: 4000, nice: 0, sys: 1000, idle: 5000, irq: 0 } },
    ]);
    vi.mocked(os.freemem).mockReturnValue(8 * 1024 ** 3);

    const monitor = new ResourceMonitor();
    const state = await monitor.getState();

    expect(state.cpuLoad).toBeGreaterThan(0);
    expect(state.monitoringFailed).toBe(false);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });
});
