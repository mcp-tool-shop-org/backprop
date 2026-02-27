import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExperimentStore, RunRecord } from '../src/experiments/store.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Compare command logic', () => {
  let store: ExperimentStore;
  const tmpDir = path.join(os.tmpdir(), 'backprop-test-compare');

  beforeEach(async () => {
    await fs.mkdir(tmpDir, { recursive: true });
    store = new ExperimentStore(tmpDir);
    await store.init();
  });

  afterEach(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true });
    } catch {}
  });

  it('should retrieve two runs for comparison', async () => {
    const runA: RunRecord = {
      id: 'run-a',
      name: 'First Run',
      scriptPath: 'train.py',
      status: 'completed',
      startTime: 1000,
      endTime: 2000,
      lastStep: 100,
      lastLoss: 0.5,
      checkpoints: ['ckpt-1']
    };
    const runB: RunRecord = {
      id: 'run-b',
      name: 'Second Run',
      scriptPath: 'train.py',
      status: 'failed',
      startTime: 3000,
      endTime: 4000,
      lastStep: 50,
      lastLoss: 1.2,
      checkpoints: ['ckpt-2', 'ckpt-3']
    };

    await store.saveRun(runA);
    await store.saveRun(runB);

    const a = await store.getRun('run-a');
    const b = await store.getRun('run-b');

    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(a!.lastLoss).toBe(0.5);
    expect(b!.lastLoss).toBe(1.2);
    expect(a!.checkpoints?.length).toBe(1);
    expect(b!.checkpoints?.length).toBe(2);
  });

  it('should return undefined for non-existent run', async () => {
    const run = await store.getRun('nonexistent');
    expect(run).toBeUndefined();
  });
});
