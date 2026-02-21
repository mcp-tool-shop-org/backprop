import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { program } from '../src/cli.js';
import { ConfigSchema } from '../src/config/schema.js';
import { TokenBucket } from '../src/governor/token-bucket.js';
import { ResourceMonitor } from '../src/governor/resource-monitor.js';
import { Governor } from '../src/governor/policy.js';
import { PythonRunner } from '../src/runner/python-runner.js';

describe('Backprop CLI', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. should have a run command', () => {
    const cmd = program.commands.find(c => c.name() === 'run');
    expect(cmd).toBeDefined();
  });

  it('2. should have a status command', () => {
    const cmd = program.commands.find(c => c.name() === 'status');
    expect(cmd).toBeDefined();
  });

  it('3. should parse valid config', () => {
    const config = ConfigSchema.parse({
      trainingScriptPath: 'train.py',
      framework: 'pytorch',
      maxRunMinutes: 5,
      maxParallel: 2
    });
    expect(config.trainingScriptPath).toBe('train.py');
    expect(config.framework).toBe('pytorch');
    expect(config.maxRunMinutes).toBe(5);
    expect(config.maxParallel).toBe(2);
  });

  it('4. should reject invalid config', () => {
    expect(() => ConfigSchema.parse({
      trainingScriptPath: '',
      framework: 'invalid'
    })).toThrow();
  });

  it('5. should default to auto framework and 10 minutes', () => {
    const config = ConfigSchema.parse({
      trainingScriptPath: 'train.py'
    });
    expect(config.framework).toBe('auto');
    expect(config.maxRunMinutes).toBe(10);
  });

  it('6. should consume tokens correctly', async () => {
    const bucket = new TokenBucket(4, 1, 60000);
    expect(await bucket.acquire(1)).toBe(true);
    expect(await bucket.acquire(3)).toBe(true);
    expect(await bucket.acquire(1)).toBe(false);
  });

  it('7. should refill tokens over time', async () => {
    const bucket = new TokenBucket(4, 1, 60000);
    await bucket.acquire(4);
    expect(await bucket.acquire(1)).toBe(false);
    
    vi.advanceTimersByTime(60000);
    expect(await bucket.acquire(1)).toBe(true);
  });

  it('8. should monitor resources', async () => {
    const monitor = new ResourceMonitor();
    const usage = await monitor.getState();
    expect(parseFloat(usage.cpuLoad)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(usage.ramFreeGB)).toBeGreaterThan(0);
  });

  it('9. governor should allow run if resources are sufficient', async () => {
    const bucket = new TokenBucket(4, 1, 60000);
    const monitor = new ResourceMonitor();
    vi.spyOn(monitor, 'getState').mockResolvedValue({
      ramFreeGB: 8.00,
      cpuLoad: 1.00,
      gpuCount: 1,
      gpuVRAMFreeMB: 8000,
      tempC: 60,
      monitoringFailed: false
    });
    const governor = new Governor(bucket, monitor, 2, 4);
    const result = await governor.canStartRun();
    expect(result.allowed).toBe(true);
  });

  it('10. governor should reject run if RAM is low', async () => {
    const bucket = new TokenBucket(4, 1, 60000);
    const monitor = new ResourceMonitor();
    vi.spyOn(monitor, 'getState').mockResolvedValue({
      ramFreeGB: 2.00,
      cpuLoad: 1.00,
      gpuCount: 1,
      gpuVRAMFreeMB: 8000,
      tempC: 60,
      monitoringFailed: false
    });
    const governor = new Governor(bucket, monitor, 2, 4);
    const result = await governor.canStartRun();
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('low RAM');
  });

  it('11. governor should reject run if tokens are exhausted', async () => {
    const bucket = new TokenBucket(4, 1, 60000);
    await bucket.acquire(4);
    const monitor = new ResourceMonitor();
    const governor = new Governor(bucket, monitor, 2, 4);
    const result = await governor.canStartRun();
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('token bucket exhausted');
  });

  it('12. runner should not start if governor rejects', async () => {
    const config = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
    const bucket = new TokenBucket(4, 1, 60000);
    await bucket.acquire(4); // exhaust tokens
    const monitor = new ResourceMonitor();
    const governor = new Governor(bucket, monitor, 2, 4);
    const runner = new PythonRunner(config, governor);
    
    const result = await runner.run();
    expect(result.success).toBe(false);
    expect(result.error).toContain('Governor rejected run');
  });

  it('smoke test: should initialize CLI without crashing', () => {
    expect(program.name()).toBe('backprop');
    expect(program.version()).toBeDefined();
  });
});
