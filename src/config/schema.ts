import { z } from 'zod';

export const ConfigSchema = z.object({
  trainingScriptPath: z.string().min(1, "Training script path is required"),
  framework: z.enum(['pytorch', 'tensorflow', 'auto']).default('auto'),
  maxRunMinutes: z.number().positive().default(10),
  gpuMemoryLimitGb: z.number().positive().optional(),
  maxParallel: z.number().int().positive().default(1),
  checkpointEveryMinutes: z.number().positive().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;
