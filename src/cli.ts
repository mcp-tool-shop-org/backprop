import { Command } from 'commander';
import { ConfigSchema } from './config/schema.js';
import { PythonRunner } from './runner/python-runner.js';
import { ResourceMonitor } from './governor/resource-monitor.js';
import { TokenBucket } from './governor/token-bucket.js';
import { Governor } from './governor/policy.js';

export const program = new Command();

program
  .name('backprop')
  .description('CLI-first ML trainer with intelligent resource governance')
  .version('0.1.0');

program
  .command('run')
  .description('Run a training script')
  .argument('<script>', 'Path to the Python training script')
  .option('-f, --framework <type>', 'Framework to use (pytorch | tensorflow | auto)', 'auto')
  .option('-m, --max-run-minutes <minutes>', 'Maximum run time in minutes', '10')
  .option('-g, --gpu-memory-limit-gb <gb>', 'GPU memory limit in GB')
  .option('-p, --max-parallel <count>', 'Maximum parallel runs', '1')
  .option('-c, --checkpoint-every-minutes <minutes>', 'Checkpoint interval in minutes')
  .action(async (script, options) => {
    try {
      const config = ConfigSchema.parse({
        trainingScriptPath: script,
        framework: options.framework,
        maxRunMinutes: parseFloat(options.maxRunMinutes),
        gpuMemoryLimitGb: options.gpuMemoryLimitGb ? parseFloat(options.gpuMemoryLimitGb) : undefined,
        maxParallel: parseInt(options.maxParallel, 10),
        checkpointEveryMinutes: options.checkpointEveryMinutes ? parseFloat(options.checkpointEveryMinutes) : undefined,
      });

      console.log(`Starting training run for ${config.trainingScriptPath}...`);
      const tokenBucket = new TokenBucket();
      const monitor = new ResourceMonitor();
      const governor = new Governor(tokenBucket, monitor, config.maxParallel);
      const runner = new PythonRunner(config, governor);
      const result = await runner.run();

      if (result.success) {
        console.log(`Training completed successfully in ${result.durationMs}ms`);
      } else {
        console.error(`Training failed with exit code ${result.exitCode}`);
        if (result.error) {
          console.error(result.error);
        }
        process.exit(1);
      }
    } catch (error) {
      console.error('Configuration error:', error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show current resource status')
  .action(async () => {
    const monitor = new ResourceMonitor();
    const usage = await monitor.getUsage();
    console.log('Resource Status:');
    console.log(`CPU Usage: ${usage.cpuPercent.toFixed(2)}%`);
    console.log(`RAM Usage: ${usage.ramUsedGb.toFixed(2)}GB / ${usage.ramTotalGb.toFixed(2)}GB`);
    console.log(`GPU Memory: ${usage.gpuMemoryUsedGb}GB / ${usage.gpuMemoryTotalGb}GB`);
  });

import { fileURLToPath } from 'url';

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  program.parse(process.argv);
}
