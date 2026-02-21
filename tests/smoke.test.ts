import { describe, it, expect } from 'vitest';
import { PythonRunner } from '../src/runner/python-runner.js';
import { ConfigSchema } from '../src/config/schema.js';
import { Governor } from '../src/governor/policy.js';
import { TokenBucket } from '../src/governor/token-bucket.js';
import { ResourceMonitor } from '../src/governor/resource-monitor.js';
import { ExperimentStore } from '../src/experiments/store.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Smoke Test', () => {
  it('should run a dummy Python script safely', async () => {
    const dummyScript = path.join(__dirname, 'dummy.py');
    const config = ConfigSchema.parse({
      trainingScriptPath: dummyScript,
      maxRunMinutes: 0.01, // very short run
    });
    
    const bucket = new TokenBucket(4, 1, 60000);
    const monitor = new ResourceMonitor();
    const governor = new Governor(bucket, monitor, 2, 0); // 0 RAM limit to ensure it runs
    const store = new ExperimentStore();
    
    const runner = new PythonRunner(config, governor, store);
    const result = await runner.run();
    
    expect(result.success).toBe(true);
    expect(result.reason).toBe('completed');
  });
});
