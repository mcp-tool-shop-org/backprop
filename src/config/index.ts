import * as fs from 'fs/promises';
import * as path from 'path';
import { Config, ConfigSchema } from './schema.js';

export async function loadConfig(cliOptions: Partial<Config>, configPath?: string): Promise<Config> {
  let fileConfig: Partial<Config> = {};
  
  const defaultPaths = [
    configPath,
    path.join(process.cwd(), 'backprop.config.json'),
    path.join(process.cwd(), '.backprop.json')
  ].filter(Boolean) as string[];

  for (const p of defaultPaths) {
    try {
      const data = await fs.readFile(p, 'utf-8');
      fileConfig = JSON.parse(data);
      break; // Stop at first found config
    } catch (e: any) {
      if (e.code !== 'ENOENT') {
        console.warn(`Warning: Could not parse config file at ${p}: ${e.message}`);
      }
    }
  }

  // Merge file config with CLI options (CLI wins)
  const merged = {
    ...fileConfig,
    ...cliOptions,
  };

  // Apply sensible defaults if not provided
  if (merged.maxRunMinutes === undefined) merged.maxRunMinutes = 10;
  if (merged.maxParallel === undefined) merged.maxParallel = 2;
  if (merged.gpuMemoryLimit === undefined) merged.gpuMemoryLimit = '80%';

  return ConfigSchema.parse(merged);
}
