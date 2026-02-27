import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExperimentStore, RunRecord } from '../src/experiments/store.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('ExperimentStore extended', () => {
  let store: ExperimentStore;
  const tmpDir = path.join(os.tmpdir(), 'backprop-test-store-ext');

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

  describe('getLatestCheckpoint', () => {
    it('returns last element of checkpoints array', async () => {
      await store.saveRun({
        id: 'run-1',
        scriptPath: 'train.py',
        status: 'completed',
        startTime: 1000,
        checkpoints: ['ckpt-1', 'ckpt-2', 'ckpt-3'],
      });

      const ckpt = await store.getLatestCheckpoint('run-1');
      expect(ckpt).toBe('ckpt-3');
    });

    it('falls back to lastCheckpoint when no checkpoints array', async () => {
      await store.saveRun({
        id: 'run-2',
        scriptPath: 'train.py',
        status: 'completed',
        startTime: 1000,
        lastCheckpoint: 'legacy-ckpt',
      });

      const ckpt = await store.getLatestCheckpoint('run-2');
      expect(ckpt).toBe('legacy-ckpt');
    });

    it('returns undefined when no checkpoints exist', async () => {
      await store.saveRun({
        id: 'run-3',
        scriptPath: 'train.py',
        status: 'completed',
        startTime: 1000,
      });

      const ckpt = await store.getLatestCheckpoint('run-3');
      expect(ckpt).toBeUndefined();
    });

    it('returns undefined for non-existent run', async () => {
      const ckpt = await store.getLatestCheckpoint('nonexistent');
      expect(ckpt).toBeUndefined();
    });

    it('prefers checkpoints array over lastCheckpoint', async () => {
      await store.saveRun({
        id: 'run-4',
        scriptPath: 'train.py',
        status: 'completed',
        startTime: 1000,
        lastCheckpoint: 'old-ckpt',
        checkpoints: ['new-ckpt-1', 'new-ckpt-2'],
      });

      const ckpt = await store.getLatestCheckpoint('run-4');
      expect(ckpt).toBe('new-ckpt-2');
    });
  });

  describe('listExperiments', () => {
    it('returns empty array when no experiments', async () => {
      const list = await store.listExperiments();
      expect(list).toEqual([]);
    });

    it('sorts by startTime descending (newest first)', async () => {
      await store.saveRun({ id: 'old', scriptPath: 'a.py', status: 'completed', startTime: 1000 });
      await store.saveRun({ id: 'mid', scriptPath: 'b.py', status: 'completed', startTime: 2000 });
      await store.saveRun({ id: 'new', scriptPath: 'c.py', status: 'completed', startTime: 3000 });

      const list = await store.listExperiments();
      expect(list.map(r => r.id)).toEqual(['new', 'mid', 'old']);
    });
  });

  describe('saveRun', () => {
    it('updates existing run record', async () => {
      await store.saveRun({
        id: 'run-x',
        scriptPath: 'train.py',
        status: 'running',
        startTime: 1000,
      });

      // Update status
      await store.saveRun({
        id: 'run-x',
        scriptPath: 'train.py',
        status: 'completed',
        startTime: 1000,
        endTime: 2000,
        lastLoss: 0.01,
      });

      const run = await store.getRun('run-x');
      expect(run!.status).toBe('completed');
      expect(run!.lastLoss).toBe(0.01);
    });

    it('persists to disk', async () => {
      await store.saveRun({
        id: 'persist-test',
        scriptPath: 'train.py',
        status: 'completed',
        startTime: 1000,
      });

      // Create a new store instance from same directory
      const store2 = new ExperimentStore(tmpDir);
      await store2.init();
      const run = await store2.getRun('persist-test');
      expect(run).toBeDefined();
      expect(run!.status).toBe('completed');
    });
  });

  describe('init', () => {
    it('handles corrupt JSON file gracefully', async () => {
      await fs.writeFile(path.join(tmpDir, 'experiments.json'), '{ corrupt }');

      const store2 = new ExperimentStore(tmpDir);
      // Should not throw, just warn and start fresh
      await store2.init();

      const list = await store2.listExperiments();
      expect(list).toEqual([]);
    });

    it('creates directory if it does not exist', async () => {
      const nestedDir = path.join(tmpDir, 'nested', 'dir');
      const store2 = new ExperimentStore(nestedDir);
      await store2.init();

      await store2.saveRun({
        id: 'nested-test',
        scriptPath: 'train.py',
        status: 'completed',
        startTime: 1000,
      });

      const run = await store2.getRun('nested-test');
      expect(run).toBeDefined();
    });
  });
});
