import { Command } from 'commander';
import { ConfigSchema } from './config/schema.js';
import { PythonRunner } from './runner/python-runner.js';
import { ResourceMonitor } from './governor/resource-monitor.js';
import { TokenBucket } from './governor/token-bucket.js';
import { Governor } from './governor/policy.js';
import { ExperimentStore } from './experiments/store.js';

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
  .option('-r, --resume-from <path>', 'Path to checkpoint to resume from')
  .option('--run-id <id>', 'Unique identifier for this run')
  .option('-n, --name <name>', 'Human-readable name for this experiment')
  .action(async (script, options) => {
    try {
      const config = ConfigSchema.parse({
        trainingScriptPath: script,
        framework: options.framework,
        maxRunMinutes: parseFloat(options.maxRunMinutes),
        gpuMemoryLimitGb: options.gpuMemoryLimitGb ? parseFloat(options.gpuMemoryLimitGb) : undefined,
        maxParallel: parseInt(options.maxParallel, 10),
        checkpointEveryMinutes: options.checkpointEveryMinutes ? parseFloat(options.checkpointEveryMinutes) : undefined,
        resumeFrom: options.resumeFrom,
        runId: options.runId,
      });

      console.log(`Starting training run for ${config.trainingScriptPath}...`);
      const tokenBucket = new TokenBucket();
      const monitor = new ResourceMonitor();
      const governor = new Governor(tokenBucket, monitor, config.maxParallel);
      const store = new ExperimentStore();
      await store.init();
      
      // If name is provided, we need to update the run record after it's created
      // The runner creates it if it doesn't exist, but we can pre-create it here
      const existingRun = await store.getRun(config.runId);
      if (!existingRun) {
        await store.saveRun({
          id: config.runId,
          name: options.name,
          scriptPath: config.trainingScriptPath,
          status: 'running',
          startTime: Date.now()
        });
      } else if (options.name) {
        existingRun.name = options.name;
        await store.saveRun(existingRun);
      }

      const runner = new PythonRunner(config, governor, store);
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
  .command('resume')
  .description('Resume a previous training run')
  .argument('<run-id>', 'ID of the run to resume')
  .option('-m, --max-run-minutes <minutes>', 'Maximum run time in minutes', '10')
  .action(async (runId, options) => {
    const store = new ExperimentStore();
    await store.init();
    const run = await store.getRun(runId);
    
    if (!run) {
      console.error(`Run ${runId} not found.`);
      process.exit(1);
    }

    console.log(`Resuming run ${runId} (${run.name || 'unnamed'})...`);
    
    try {
      const config = ConfigSchema.parse({
        trainingScriptPath: run.scriptPath,
        maxRunMinutes: parseFloat(options.maxRunMinutes),
        runId: runId,
      });

      const tokenBucket = new TokenBucket();
      const monitor = new ResourceMonitor();
      const governor = new Governor(tokenBucket, monitor, 1);
      const runner = new PythonRunner(config, governor, store);
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
  .command('list')
  .description('List all training experiments')
  .action(async () => {
    const store = new ExperimentStore();
    await store.init();
    const runs = await store.listExperiments();
    
    if (runs.length === 0) {
      console.log('No experiments found.');
      return;
    }

    console.log('Experiments:');
    for (const run of runs) {
      const name = run.name ? `"${run.name}"` : 'unnamed';
      const date = new Date(run.startTime).toLocaleString();
      console.log(`- [${run.id}] ${name} | Status: ${run.status} | Started: ${date}`);
    }
  });

program
  .command('status')
  .description('Show current resource status or status of a specific run')
  .argument('[run-id]', 'Optional run ID to show status for')
  .action(async (runId) => {
    if (runId) {
      const store = new ExperimentStore();
      await store.init();
      const run = await store.getRun(runId);
      if (!run) {
        console.error(`Run ${runId} not found.`);
        process.exit(1);
      }
      console.log(`Run Status: ${run.id}`);
      console.log(`Name: ${run.name || 'N/A'}`);
      console.log(`Script: ${run.scriptPath}`);
      console.log(`Status: ${run.status}`);
      console.log(`Started: ${new Date(run.startTime).toLocaleString()}`);
      if (run.endTime) {
        console.log(`Ended: ${new Date(run.endTime).toLocaleString()}`);
      }
      if (run.lastCheckpoint) {
        console.log(`Latest Checkpoint: ${run.lastCheckpoint}`);
      }
      return;
    }

    const monitor = new ResourceMonitor();
    const usage = await monitor.getState();
    console.log('Resource Status:');
    console.log(`CPU Load: ${usage.cpuLoad}`);
    console.log(`RAM Free: ${usage.ramFreeGB}GB`);
    console.log(`GPU VRAM Free: ${usage.gpuVRAMFreeMB ?? 'Unknown'}MB`);
    console.log(`Temp: ${usage.tempC ?? 'Unknown'}C`);
  });

import { fileURLToPath } from 'url';

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  program.parse(process.argv);
}
