import { z } from 'zod';

export const ConfigSchema = z.object({
  trainingScriptPath: z.string().min(1, "Training script path is required"),
  runId: z.string().default(() => `run-${Date.now()}`),
  framework: z.enum(['pytorch', 'tensorflow', 'auto']).default('auto'),
  maxRunMinutes: z.number().positive().default(10),
  gpuMemoryLimit: z.union([z.number().positive(), z.string()]).optional(),
  maxParallel: z.number().int().positive().default(2),
  checkpointEveryMinutes: z.number().positive().optional(),
  resumeFrom: z.string().optional(),
  gpu: z.object({
    probe: z.enum(['auto', 'nvidia-smi', 'none']).default('auto'),
    minFreeVramMB: z.number().positive().default(2500),
    maxTempC: z.number().positive().default(85),
  }).default({}),
});

export type Config = z.infer<typeof ConfigSchema>;
