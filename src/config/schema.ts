import { z } from 'zod';

const safePath = z.string().min(1).refine(
  (p) => !p.includes('..'),
  { message: "Path traversal ('..') is not allowed" }
);

export const ConfigSchema = z.object({
  trainingScriptPath: safePath,
  runId: z.string().default(() => `run-${Date.now()}`),
  framework: z.enum(['pytorch', 'tensorflow', 'auto']).default('auto'),
  maxRunMinutes: z.number().positive().default(10),
  gpuMemoryLimit: z.union([z.number().positive(), z.string()]).optional(),
  maxParallel: z.number().int().positive().default(2),
  minFreeRamGB: z.number().positive().default(4),
  checkpointEveryMinutes: z.number().positive().optional(),
  resumeFrom: safePath.optional(),
  gpu: z.object({
    probe: z.enum(['auto', 'nvidia-smi', 'none']).default('auto'),
    minFreeVramMB: z.number().positive().default(2500),
    maxTempC: z.number().positive().default(85),
  }).default({}),
});

export type Config = z.infer<typeof ConfigSchema>;
