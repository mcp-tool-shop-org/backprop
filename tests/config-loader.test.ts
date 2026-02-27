import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { loadConfig } from '../src/config/index.js';

describe('loadConfig', () => {
  const tmpDir = path.join(os.tmpdir(), 'backprop-test-config');

  beforeEach(async () => {
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true });
    } catch {}
  });

  it('loads config from explicit path', async () => {
    const configFile = path.join(tmpDir, 'custom.json');
    await fs.writeFile(configFile, JSON.stringify({
      trainingScriptPath: 'train.py',
      maxRunMinutes: 30,
    }));

    const config = await loadConfig({}, configFile);
    expect(config.trainingScriptPath).toBe('train.py');
    expect(config.maxRunMinutes).toBe(30);
  });

  it('CLI options override file config', async () => {
    const configFile = path.join(tmpDir, 'config.json');
    await fs.writeFile(configFile, JSON.stringify({
      trainingScriptPath: 'file-train.py',
      maxRunMinutes: 30,
      framework: 'tensorflow',
    }));

    const config = await loadConfig(
      { trainingScriptPath: 'cli-train.py', framework: 'pytorch' } as any,
      configFile,
    );
    expect(config.trainingScriptPath).toBe('cli-train.py');
    expect(config.framework).toBe('pytorch');
    expect(config.maxRunMinutes).toBe(30); // from file, not overridden
  });

  it('applies sensible defaults when no file found', async () => {
    const config = await loadConfig(
      { trainingScriptPath: 'train.py' } as any,
      path.join(tmpDir, 'nonexistent.json'),
    );
    expect(config.maxRunMinutes).toBe(10);
    expect(config.maxParallel).toBe(2);
    expect(config.gpuMemoryLimit).toBe('80%');
  });

  it('handles invalid JSON in config file gracefully', async () => {
    const configFile = path.join(tmpDir, 'bad.json');
    await fs.writeFile(configFile, '{ invalid json }');

    // Should warn but still work with CLI options + defaults
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const config = await loadConfig(
      { trainingScriptPath: 'train.py' } as any,
      configFile,
    );
    expect(config.trainingScriptPath).toBe('train.py');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('skips missing files silently (ENOENT)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const config = await loadConfig(
      { trainingScriptPath: 'train.py' } as any,
      path.join(tmpDir, 'does-not-exist.json'),
    );
    expect(config.trainingScriptPath).toBe('train.py');
    // ENOENT should NOT trigger a warning
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('validates merged config with Zod schema', async () => {
    // Empty trainingScriptPath should fail validation
    await expect(loadConfig({} as any)).rejects.toThrow();
  });
});
