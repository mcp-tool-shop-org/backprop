import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PythonRunner } from '../src/runner/python-runner.js';
import { ConfigSchema } from '../src/config/schema.js';
import { Governor } from '../src/governor/policy.js';
import { TokenBucket } from '../src/governor/token-bucket.js';
import { ResourceMonitor } from '../src/governor/resource-monitor.js';
import { ExperimentStore } from '../src/experiments/store.js';
import * as child_process from 'child_process';
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import * as probes from '../src/governor/probes/index.js';
import * as path from 'path';
import { formatDuration } from '../src/utils/format.js';
import { access } from 'fs/promises';

vi.mock('child_process');
vi.mock('../src/governor/probes/index.js');
vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return { ...actual, access: vi.fn().mockResolvedValue(undefined) };
});

const mockedAccess = vi.mocked(access);

// --- Dynamic version test ---
describe('CLI dynamic version', () => {
  it('reads version from package.json', async () => {
    const { program } = await import('../src/cli.js');
    const { readFileSync } = await import('fs');
    const pkgJson = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
    expect(program.version()).toBe(pkgJson.version);
  });
});

// --- PythonRunner enhancement tests ---
describe('PythonRunner enhancements', () => {
  let governor: Governor;
  let mockSpawn: any;
  let mockStore: any;

  beforeEach(() => {
    vi.useFakeTimers();
    const bucket = new TokenBucket(4, 1, 60000);
    const monitor = new ResourceMonitor();
    vi.spyOn(monitor, 'getState').mockResolvedValue({
      ramFreeGB: 8.00,
      cpuLoad: 1.00,
      monitoringFailed: false,
    });
    vi.mocked(probes.getGpuProbe).mockResolvedValue({
      vramFreeMB: 8000,
      temperatureC: 60,
      utilizationPercent: 50,
    });
    governor = new Governor(bucket, monitor, 2, 4);

    mockStore = {
      getRun: vi.fn().mockResolvedValue(null),
      saveRun: vi.fn().mockResolvedValue(undefined),
      getLatestCheckpoint: vi.fn().mockResolvedValue(null),
      listExperiments: vi.fn().mockResolvedValue([]),
    } as unknown as ExperimentStore;

    mockedAccess.mockResolvedValue(undefined);

    mockSpawn = vi.spyOn(child_process, 'spawn').mockImplementation(() => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new PassThrough();
      mockProcess.stderr = new PassThrough();
      mockProcess.kill = vi.fn();
      mockProcess.exitCode = null;

      setTimeout(() => {
        mockProcess.exitCode = 0;
        mockProcess.emit('close', 0, null);
      }, 100);

      return mockProcess;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('checkpoint path validation', () => {
    it('rejects checkpoint with path traversal', async () => {
      const config = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
      const runner = new PythonRunner(config, governor, mockStore);

      let mockProcess: any;
      mockSpawn.mockImplementation(() => {
        mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new PassThrough();
        mockProcess.stderr = new PassThrough();
        mockProcess.kill = vi.fn();
        mockProcess.exitCode = null;

        setTimeout(() => {
          mockProcess.stdout.write(JSON.stringify({ event: 'checkpoint_saved', path: '../../evil/path' }) + '\n');
        }, 30);
        setTimeout(() => {
          mockProcess.exitCode = 0;
          mockProcess.emit('close', 0, null);
        }, 100);

        return mockProcess;
      });

      const runPromise = runner.run();
      await vi.advanceTimersByTimeAsync(150);
      await runPromise;

      const saveCalls = mockStore.saveRun.mock.calls;
      const lastSave = saveCalls[saveCalls.length - 1][0];
      expect(lastSave.checkpoints || []).not.toContain('../../evil/path');
    });

    it('accepts valid checkpoint path', async () => {
      const config = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
      const runner = new PythonRunner(config, governor, mockStore);

      let mockProcess: any;
      mockSpawn.mockImplementation(() => {
        mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new PassThrough();
        mockProcess.stderr = new PassThrough();
        mockProcess.kill = vi.fn();
        mockProcess.exitCode = null;

        setTimeout(() => {
          mockProcess.stdout.write(JSON.stringify({ event: 'checkpoint_saved', path: '/tmp/ckpt-100.pt' }) + '\n');
        }, 30);
        setTimeout(() => {
          mockProcess.exitCode = 0;
          mockProcess.emit('close', 0, null);
        }, 100);

        return mockProcess;
      });

      const runPromise = runner.run();
      await vi.advanceTimersByTimeAsync(150);
      await runPromise;

      const saveCalls = mockStore.saveRun.mock.calls;
      const hasCkpt = saveCalls.some((c: any) => c[0].checkpoints?.includes('/tmp/ckpt-100.pt'));
      expect(hasCkpt).toBe(true);
    });
  });

  describe('lastStep/lastLoss tracking', () => {
    it('saves step and loss from progress updates', async () => {
      const config = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
      const runner = new PythonRunner(config, governor, mockStore);

      let mockProcess: any;
      mockSpawn.mockImplementation(() => {
        mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new PassThrough();
        mockProcess.stderr = new PassThrough();
        mockProcess.kill = vi.fn();
        mockProcess.exitCode = null;

        setTimeout(() => {
          mockProcess.stdout.write(JSON.stringify({ step: 100, loss: 0.5 }) + '\n');
        }, 20);
        setTimeout(() => {
          mockProcess.stdout.write(JSON.stringify({ step: 200, loss: 0.25 }) + '\n');
        }, 40);
        setTimeout(() => {
          mockProcess.exitCode = 0;
          mockProcess.emit('close', 0, null);
        }, 100);

        return mockProcess;
      });

      const runPromise = runner.run();
      await vi.advanceTimersByTimeAsync(150);
      await runPromise;

      const saveCalls = mockStore.saveRun.mock.calls;
      const withStep200 = saveCalls.find((c: any) => c[0].lastStep === 200 && c[0].lastLoss === 0.25);
      expect(withStep200).toBeDefined();
    });
  });

  describe('stderr buffer limit', () => {
    it('truncates stderr beyond 10MB', async () => {
      const config = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
      const runner = new PythonRunner(config, governor, mockStore);

      let mockProcess: any;
      mockSpawn.mockImplementation(() => {
        mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new PassThrough();
        mockProcess.stderr = new PassThrough();
        mockProcess.kill = vi.fn();
        mockProcess.exitCode = null;

        const bigChunk = 'x'.repeat(1024 * 1024); // 1MB
        setTimeout(() => {
          for (let i = 0; i < 12; i++) {
            mockProcess.stderr.write(bigChunk);
          }
        }, 20);
        setTimeout(() => {
          mockProcess.exitCode = 1;
          mockProcess.emit('close', 1, null);
        }, 100);

        return mockProcess;
      });

      const runPromise = runner.run();
      await vi.advanceTimersByTimeAsync(150);
      const result = await runPromise;

      expect(result.error).toBeDefined();
      expect(Buffer.byteLength(result.error!)).toBeLessThanOrEqual(11 * 1024 * 1024);
    });
  });

  describe('auto-resume checkpoint existence check', () => {
    it('skips stale checkpoint that no longer exists on disk', async () => {
      mockStore.getLatestCheckpoint.mockResolvedValue('/tmp/deleted-checkpoint.pt');

      mockedAccess.mockImplementation(async (p: any) => {
        if (String(p) === '/tmp/deleted-checkpoint.pt') {
          throw new Error('ENOENT');
        }
        return undefined;
      });

      const config = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
      const runner = new PythonRunner(config, governor, mockStore);

      const runPromise = runner.run();
      await vi.advanceTimersByTimeAsync(150);
      await runPromise;

      expect(mockSpawn).toHaveBeenCalledWith(
        'python',
        expect.not.arrayContaining(['--resume-from']),
        expect.any(Object),
      );
    });

    it('uses checkpoint that exists on disk', async () => {
      mockStore.getLatestCheckpoint.mockResolvedValue('/tmp/valid-checkpoint.pt');
      mockedAccess.mockResolvedValue(undefined);

      const config = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
      const runner = new PythonRunner(config, governor, mockStore);

      const runPromise = runner.run();
      await vi.advanceTimersByTimeAsync(150);
      await runPromise;

      expect(mockSpawn).toHaveBeenCalledWith(
        'python',
        expect.arrayContaining(['--resume-from', '/tmp/valid-checkpoint.pt']),
        expect.any(Object),
      );
    });
  });
});

// --- formatDuration tests for list enhancement ---
describe('formatDuration for list command', () => {
  it('formats seconds', () => {
    expect(formatDuration(0, 30000)).toBe('30s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(0, 90000)).toBe('1m 30s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(0, 3660000)).toBe('1h 1m');
  });
});
