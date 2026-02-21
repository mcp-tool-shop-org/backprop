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
});

export type Config = z.infer<typeof ConfigSchema>;
