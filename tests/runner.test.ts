import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PythonRunner } from '../src/runner/python-runner.js';
import { ConfigSchema } from '../src/config/schema.js';
import { Governor } from '../src/governor/policy.js';
import { TokenBucket } from '../src/governor/token-bucket.js';
import { ResourceMonitor } from '../src/governor/resource-monitor.js';
import * as child_process from 'child_process';
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';

vi.mock('child_process');

describe('PythonRunner', () => {
  let governor: Governor;
  let mockSpawn: any;

  beforeEach(() => {
    vi.useFakeTimers();
    const bucket = new TokenBucket(4, 1, 60000);
    const monitor = new ResourceMonitor();
    vi.spyOn(monitor, 'getState').mockResolvedValue({
      ramFreeGB: '8.00',
      cpuLoad: '1.00',
      gpuVRAMFreeMB: 8000,
      tempC: 60
    });
    governor = new Governor(bucket, monitor, 2, 4);
    
    mockSpawn = vi.spyOn(child_process, 'spawn').mockImplementation(() => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new PassThrough();
      mockProcess.stderr = new PassThrough();
      mockProcess.kill = vi.fn();
      mockProcess.exitCode = null;
      
      // Auto-close after a short delay to simulate completion
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

  it('1. should run successfully', async () => {
    const config = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
    const runner = new PythonRunner(config, governor);
    
    const runPromise = runner.run();
    await vi.advanceTimersByTimeAsync(150);
    const result = await runPromise;
    
    expect(result.success).toBe(true);
    expect(result.reason).toBe('completed');
    expect(mockSpawn).toHaveBeenCalledWith('python', expect.arrayContaining(['train.py']), expect.any(Object));
  });

  it('2. should pass framework flag', async () => {
    const config = ConfigSchema.parse({ trainingScriptPath: 'train.py', framework: 'pytorch' });
    const runner = new PythonRunner(config, governor);
    
    const runPromise = runner.run();
    await vi.advanceTimersByTimeAsync(150);
    await runPromise;
    
    expect(mockSpawn).toHaveBeenCalledWith('python', expect.arrayContaining(['--framework', 'pytorch']), expect.any(Object));
  });

  it('3. should pass checkpoint interval', async () => {
    const config = ConfigSchema.parse({ trainingScriptPath: 'train.py', checkpointEveryMinutes: 5 });
    const runner = new PythonRunner(config, governor);
    
    const runPromise = runner.run();
    await vi.advanceTimersByTimeAsync(150);
    await runPromise;
    
    expect(mockSpawn).toHaveBeenCalledWith('python', expect.arrayContaining(['--checkpoint-every-seconds', '300']), expect.any(Object));
  });

  it('4. should pass resume-from flag', async () => {
    const config = ConfigSchema.parse({ trainingScriptPath: 'train.py', resumeFrom: 'ckpt-1' });
    const runner = new PythonRunner(config, governor);
    
    const runPromise = runner.run();
    await vi.advanceTimersByTimeAsync(150);
    await runPromise;
    
    expect(mockSpawn).toHaveBeenCalledWith('python', expect.arrayContaining(['--resume-from', 'ckpt-1']), expect.any(Object));
  });

  it('5. should pass run-id', async () => {
    const config = ConfigSchema.parse({ trainingScriptPath: 'train.py', runId: 'test-run' });
    const runner = new PythonRunner(config, governor);
    
    const runPromise = runner.run();
    await vi.advanceTimersByTimeAsync(150);
    await runPromise;
    
    expect(mockSpawn).toHaveBeenCalledWith('python', expect.arrayContaining(['--run-id', 'test-run']), expect.any(Object));
  });

  it('6. should timebox run and send SIGINT', async () => {
    const config = ConfigSchema.parse({ trainingScriptPath: 'train.py', maxRunMinutes: 10 });
    const runner = new PythonRunner(config, governor);
    
    let mockProcess: any;
    mockSpawn.mockImplementation(() => {
      mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new PassThrough();
      mockProcess.stderr = new PassThrough();
      mockProcess.kill = vi.fn((signal) => {
        if (signal === 'SIGINT') {
          mockProcess.exitCode = 0;
          mockProcess.emit('close', 0, 'SIGINT');
        }
      });
      mockProcess.exitCode = null;
      return mockProcess;
    });
    
    const runPromise = runner.run();
    
    // Advance past maxRunMinutes
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000 + 100);
    
    const result = await runPromise;
    
    expect(mockProcess.kill).toHaveBeenCalledWith('SIGINT');
    expect(result.success).toBe(true);
    expect(result.reason).toBe('timeboxed');
  });

  it('7. should send SIGKILL if SIGINT fails', async () => {
    const config = ConfigSchema.parse({ trainingScriptPath: 'train.py', maxRunMinutes: 10 });
    const runner = new PythonRunner(config, governor);
    
    let mockProcess: any;
    mockSpawn.mockImplementation(() => {
      mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new PassThrough();
      mockProcess.stderr = new PassThrough();
      mockProcess.kill = vi.fn((signal) => {
        if (signal === 'SIGKILL') {
          mockProcess.exitCode = 0;
          mockProcess.emit('close', 0, 'SIGKILL');
        }
      });
      mockProcess.exitCode = null;
      return mockProcess;
    });
    
    const runPromise = runner.run();
    
    // Advance past maxRunMinutes
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000 + 100);
    expect(mockProcess.kill).toHaveBeenCalledWith('SIGINT');
    
    // Advance past force kill timeout
    await vi.advanceTimersByTimeAsync(30000 + 100);
    
    const result = await runPromise;
    
    expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL');
    expect(result.success).toBe(true);
    expect(result.reason).toBe('timeboxed');
  });

  it('8. should handle process error', async () => {
    const config = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
    const runner = new PythonRunner(config, governor);
    
    mockSpawn.mockImplementation(() => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new PassThrough();
      mockProcess.stderr = new PassThrough();
      mockProcess.kill = vi.fn();
      mockProcess.exitCode = null;
      
      setTimeout(() => {
        mockProcess.emit('error', new Error('spawn failed'));
      }, 100);
      
      return mockProcess;
    });
    
    const runPromise = runner.run();
    await vi.advanceTimersByTimeAsync(150);
    const result = await runPromise;
    
    expect(result.success).toBe(false);
    expect(result.reason).toBe('spawn_error');
    expect(result.error).toBe('spawn failed');
  });

  it('9. should handle non-zero exit code', async () => {
    const config = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
    const runner = new PythonRunner(config, governor);
    
    mockSpawn.mockImplementation(() => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new PassThrough();
      mockProcess.stderr = new PassThrough();
      mockProcess.kill = vi.fn();
      mockProcess.exitCode = null;
      
      setTimeout(() => {
        mockProcess.exitCode = 1;
        mockProcess.emit('close', 1, null);
      }, 100);
      
      return mockProcess;
    });
    
    const runPromise = runner.run();
    await vi.advanceTimersByTimeAsync(150);
    const result = await runPromise;
    
    expect(result.success).toBe(false);
    expect(result.reason).toBe('error');
    expect(result.exitCode).toBe(1);
  });

  it('10. should allow manual stop', async () => {
    const config = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
    const runner = new PythonRunner(config, governor);
    
    let mockProcess: any;
    mockSpawn.mockImplementation(() => {
      mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new PassThrough();
      mockProcess.stderr = new PassThrough();
      mockProcess.kill = vi.fn((signal) => {
        if (signal === 'SIGINT') {
          mockProcess.exitCode = 0;
          mockProcess.emit('close', 0, 'SIGINT');
        }
      });
      mockProcess.exitCode = null;
      return mockProcess;
    });
    
    const runPromise = runner.run();
    
    // Wait for spawn
    await vi.advanceTimersByTimeAsync(10);
    
    runner.stop(); await vi.advanceTimersByTimeAsync(100);
    
    const result = await runPromise;
    
    expect(mockProcess.kill).toHaveBeenCalledWith('SIGINT');
    expect(result.success).toBe(true);
    expect(result.reason).toBe('timeboxed');
  });
});
