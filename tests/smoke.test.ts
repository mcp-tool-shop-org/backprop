import { describe, it, expect } from 'vitest';
import { PythonRunner } from '../src/runner/python-runner.js';
import { ConfigSchema } from '../src/config/schema.js';
import { Governor } from '../src/governor/policy.js';
import { TokenBucket } from '../src/governor/token-bucket.js';
import { ResourceMonitor } from '../src/governor/resource-monitor.js';
import { ExperimentStore } from '../src/experiments/store.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs/promises';
import * as os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Smoke Test', () => {
  it('should run a dummy Python script safely', async () => {
    const dummyScript = path.join(__dirname, 'dummy.py');
    const config = ConfigSchema.parse({
      trainingScriptPath: dummyScript,
      maxRunMinutes: 0.01, // very short run
    });
    
    const bucket = new TokenBucket(4, 1, 60000);
    const monitor = new ResourceMonitor();
    const governor = new Governor(bucket, monitor, 2, 0, 85, 0); // 0 RAM limit, 0 VRAM limit to ensure it runs
    const store = new ExperimentStore();
    await store.init();
    
    const runner = new PythonRunner(config, governor, store);
    const result = await runner.run();
    
    expect(result.success).toBe(true);
    expect(['completed', 'timeboxed']).toContain(result.reason);
  });

  it('should resume a run', async () => {
    const dummyScript = path.join(__dirname, 'dummy.py');
    const runId = 'test-resume-run';
    
    const store = new ExperimentStore();
    await store.init();
    
    // Create a fake checkpoint
    await store.saveRun({
      id: runId,
      scriptPath: dummyScript,
      status: 'completed',
      startTime: Date.now(),
      checkpoints: ['/fake/checkpoint/path']
    });

    const config = ConfigSchema.parse({
      trainingScriptPath: dummyScript,
      maxRunMinutes: 0.01,
      runId: runId
    });
    
    const bucket = new TokenBucket(4, 1, 60000);
    const monitor = new ResourceMonitor();
    const governor = new Governor(bucket, monitor, 2, 0, 85, 0);
    
    const runner = new PythonRunner(config, governor, store);
    const result = await runner.run();
    
    expect(result.success).toBe(true);
    expect(config.resumeFrom).toBe('/fake/checkpoint/path');
  });
});
