import { describe, it, expect, vi, afterEach } from 'vitest';
import { ExperimentStore } from '../src/experiments/store.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('ExperimentStore atomic persist', () => {
  const tmpDir = path.join(os.tmpdir(), 'backprop-test-atomic-' + Date.now());

  afterEach(async () => {
    try { await fs.rm(tmpDir, { recursive: true }); } catch {}
  });

  it('persists via atomic temp file rename (no lock or tmp leftover)', async () => {
    const store = new ExperimentStore(tmpDir);
    await store.init();
    await store.saveRun({
      id: 'atomic-test',
      scriptPath: 'train.py',
      status: 'completed',
      startTime: 1000,
    });

    const files = await fs.readdir(tmpDir);
    const lockFiles = files.filter(f => f.endsWith('.lock'));
    expect(lockFiles).toHaveLength(0);
    const tmpFiles = files.filter(f => f.endsWith('.tmp'));
    expect(tmpFiles).toHaveLength(0);

    const store2 = new ExperimentStore(tmpDir);
    await store2.init();
    const run = await store2.getRun('atomic-test');
    expect(run).toBeDefined();
    expect(run!.status).toBe('completed');
  });

  it('backs up corrupted DB before starting fresh', async () => {
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.writeFile(path.join(tmpDir, 'experiments.json'), '{ broken json !!!');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = new ExperimentStore(tmpDir);
    await store.init();

    const files = await fs.readdir(tmpDir);
    const backups = files.filter(f => f.includes('.corrupt.'));
    expect(backups.length).toBeGreaterThanOrEqual(1);

    await store.saveRun({
      id: 'after-corrupt',
      scriptPath: 'train.py',
      status: 'completed',
      startTime: 2000,
    });
    const run = await store.getRun('after-corrupt');
    expect(run).toBeDefined();

    warnSpy.mockRestore();
  });

  it('preserves all data across sequential saves', async () => {
    const store = new ExperimentStore(tmpDir);
    await store.init();

    await store.saveRun({ id: 'run-a', scriptPath: 'a.py', status: 'completed', startTime: 1 });
    await store.saveRun({ id: 'run-b', scriptPath: 'b.py', status: 'completed', startTime: 2 });
    await store.saveRun({ id: 'run-c', scriptPath: 'c.py', status: 'completed', startTime: 3 });

    // Re-read from disk to verify durability
    const store2 = new ExperimentStore(tmpDir);
    await store2.init();
    const list = await store2.listExperiments();
    expect(list.length).toBe(3);
    expect(list.map(r => r.id)).toEqual(['run-c', 'run-b', 'run-a']);
  });
});
