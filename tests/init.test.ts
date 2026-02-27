import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ConfigSchema } from '../src/config/schema.js';

describe('Init command', () => {
  const tmpDir = path.join(os.tmpdir(), 'backprop-test-init');

  beforeEach(async () => {
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true });
    } catch {}
  });

  it('should create a config that passes schema validation', async () => {
    const template = {
      trainingScriptPath: "train.py",
      framework: "auto",
      maxRunMinutes: 10,
      maxParallel: 2,
      gpuMemoryLimit: "80%",
      gpu: {
        probe: "auto",
        minFreeVramMB: 2500,
        maxTempC: 85,
        minFreeRamGB: 4
      }
    };

    const configPath = path.join(tmpDir, '.backprop.json');
    await fs.writeFile(configPath, JSON.stringify(template, null, 2), 'utf-8');

    const content = await fs.readFile(configPath, 'utf-8');
    const parsed = ConfigSchema.parse(JSON.parse(content));

    expect(parsed.framework).toBe('auto');
    expect(parsed.maxRunMinutes).toBe(10);
    expect(parsed.minFreeRamGB).toBe(4);
    expect(parsed.gpu.probe).toBe('auto');
    expect(parsed.gpu.minFreeVramMB).toBe(2500);
  });

  it('should accept rocm as probe type in config', async () => {
    const template = {
      trainingScriptPath: "train.py",
      gpu: { probe: "rocm" }
    };

    const parsed = ConfigSchema.parse(template);
    expect(parsed.gpu.probe).toBe('rocm');
  });
});
