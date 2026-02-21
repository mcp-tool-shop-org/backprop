import { describe, it, expect, vi } from 'vitest';
import { program } from '../src/cli.js';
import { ConfigSchema } from '../src/config/schema.js';
import { TokenBucket } from '../src/governor/token-bucket.js';
import { ResourceMonitor } from '../src/governor/resource-monitor.js';

describe('Backprop CLI', () => {
  it('should have a run command', () => {
    const cmd = program.commands.find(c => c.name() === 'run');
    expect(cmd).toBeDefined();
  });

  it('should have a status command', () => {
    const cmd = program.commands.find(c => c.name() === 'status');
    expect(cmd).toBeDefined();
  });

  it('should parse valid config', () => {
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

  it('should reject invalid config', () => {
    expect(() => ConfigSchema.parse({
      trainingScriptPath: '',
      framework: 'invalid'
    })).toThrow();
  });

  it('should default to auto framework and 10 minutes', () => {
    const config = ConfigSchema.parse({
      trainingScriptPath: 'train.py'
    });
    expect(config.framework).toBe('auto');
    expect(config.maxRunMinutes).toBe(10);
  });

  it('should consume tokens correctly', () => {
    const bucket = new TokenBucket(10, 1);
    expect(bucket.consume(5)).toBe(true);
    expect(bucket.getTokens()).toBe(5);
  });

  it('should reject token consumption if insufficient', () => {
    const bucket = new TokenBucket(10, 1);
    expect(bucket.consume(15)).toBe(false);
  });

  it('should monitor resources', async () => {
    const monitor = new ResourceMonitor();
    const usage = await monitor.getUsage();
    expect(usage.cpuPercent).toBeGreaterThanOrEqual(0);
    expect(usage.ramTotalGb).toBeGreaterThan(0);
  });

  it('smoke test: should initialize CLI without crashing', () => {
    expect(program.name()).toBe('backprop');
    expect(program.version()).toBeDefined();
  });
});
