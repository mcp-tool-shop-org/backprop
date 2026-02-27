import { describe, it, expect } from 'vitest';
import { ConfigSchema } from '../src/config/schema.js';

describe('ConfigSchema validation', () => {
  describe('trainingScriptPath', () => {
    it('rejects empty string', () => {
      expect(() => ConfigSchema.parse({ trainingScriptPath: '' })).toThrow();
    });

    it('rejects path traversal with ..', () => {
      expect(() => ConfigSchema.parse({ trainingScriptPath: '../secret/train.py' })).toThrow('Path traversal');
    });

    it('accepts relative path without traversal', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'scripts/train.py' });
      expect(c.trainingScriptPath).toBe('scripts/train.py');
    });

    it('accepts absolute path', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: '/home/user/train.py' });
      expect(c.trainingScriptPath).toBe('/home/user/train.py');
    });
  });

  describe('resumeFrom', () => {
    it('rejects path traversal in resumeFrom', () => {
      expect(() => ConfigSchema.parse({
        trainingScriptPath: 'train.py',
        resumeFrom: '../../etc/passwd',
      })).toThrow('Path traversal');
    });

    it('allows valid checkpoint path', () => {
      const c = ConfigSchema.parse({
        trainingScriptPath: 'train.py',
        resumeFrom: 'checkpoints/ckpt-100',
      });
      expect(c.resumeFrom).toBe('checkpoints/ckpt-100');
    });

    it('is optional', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
      expect(c.resumeFrom).toBeUndefined();
    });
  });

  describe('framework', () => {
    it('defaults to auto', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
      expect(c.framework).toBe('auto');
    });

    it('accepts pytorch', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py', framework: 'pytorch' });
      expect(c.framework).toBe('pytorch');
    });

    it('accepts tensorflow', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py', framework: 'tensorflow' });
      expect(c.framework).toBe('tensorflow');
    });

    it('rejects unknown framework', () => {
      expect(() => ConfigSchema.parse({
        trainingScriptPath: 'train.py',
        framework: 'jax',
      })).toThrow();
    });
  });

  describe('maxRunMinutes', () => {
    it('defaults to 10', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
      expect(c.maxRunMinutes).toBe(10);
    });

    it('rejects zero', () => {
      expect(() => ConfigSchema.parse({
        trainingScriptPath: 'train.py',
        maxRunMinutes: 0,
      })).toThrow();
    });

    it('rejects negative', () => {
      expect(() => ConfigSchema.parse({
        trainingScriptPath: 'train.py',
        maxRunMinutes: -5,
      })).toThrow();
    });

    it('accepts fractional minutes', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py', maxRunMinutes: 0.5 });
      expect(c.maxRunMinutes).toBe(0.5);
    });
  });

  describe('gpuMemoryLimit', () => {
    it('accepts string percentage', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py', gpuMemoryLimit: '80%' });
      expect(c.gpuMemoryLimit).toBe('80%');
    });

    it('accepts numeric value', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py', gpuMemoryLimit: 8192 });
      expect(c.gpuMemoryLimit).toBe(8192);
    });

    it('is optional', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
      expect(c.gpuMemoryLimit).toBeUndefined();
    });
  });

  describe('gpu sub-schema', () => {
    it('defaults probe to auto', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
      expect(c.gpu.probe).toBe('auto');
    });

    it('defaults minFreeVramMB to 2500', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
      expect(c.gpu.minFreeVramMB).toBe(2500);
    });

    it('defaults maxTempC to 85', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
      expect(c.gpu.maxTempC).toBe(85);
    });

    it('accepts nvidia-smi probe', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py', gpu: { probe: 'nvidia-smi' } });
      expect(c.gpu.probe).toBe('nvidia-smi');
    });

    it('accepts rocm probe', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py', gpu: { probe: 'rocm' } });
      expect(c.gpu.probe).toBe('rocm');
    });

    it('accepts none probe', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py', gpu: { probe: 'none' } });
      expect(c.gpu.probe).toBe('none');
    });

    it('rejects unknown probe type', () => {
      expect(() => ConfigSchema.parse({
        trainingScriptPath: 'train.py',
        gpu: { probe: 'intel' },
      })).toThrow();
    });
  });

  describe('maxParallel', () => {
    it('defaults to 2', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
      expect(c.maxParallel).toBe(2);
    });

    it('rejects non-integer', () => {
      expect(() => ConfigSchema.parse({
        trainingScriptPath: 'train.py',
        maxParallel: 1.5,
      })).toThrow();
    });

    it('rejects zero', () => {
      expect(() => ConfigSchema.parse({
        trainingScriptPath: 'train.py',
        maxParallel: 0,
      })).toThrow();
    });
  });

  describe('runId', () => {
    it('generates default with timestamp prefix', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py' });
      expect(c.runId).toMatch(/^run-\d+$/);
    });

    it('accepts custom runId', () => {
      const c = ConfigSchema.parse({ trainingScriptPath: 'train.py', runId: 'my-experiment' });
      expect(c.runId).toBe('my-experiment');
    });
  });
});
