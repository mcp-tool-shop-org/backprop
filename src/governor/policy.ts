import { TokenBucket } from './token-bucket.js';
import { ResourceMonitor } from './resource-monitor.js';
import { getGpuProbe } from './probes/index.js';

export class Governor {
  constructor(
    private tokenBucket: TokenBucket,
    private monitor: ResourceMonitor,
    private maxParallel: number = 2,
    private minFreeRamGB: number = 4,
    private maxTempC: number = 85,
    private minFreeVramMB: number = 2500,
    private probeType: 'auto' | 'nvidia-smi' | 'none' = 'auto'
  ) {}

  async canStartRun(): Promise<{ allowed: boolean; reason?: string }> {
    if (!(await this.tokenBucket.acquire(1))) {
      return { allowed: false, reason: 'token bucket exhausted' };
    }

    const state = await this.monitor.getState();
    
    // Conservative mode if monitoring fails
    if (state.monitoringFailed) {
      console.warn('[Governor] Resource monitoring failed. Entering conservative mode.');
      // In conservative mode, we might still allow it but with strict limits, 
      // or we just allow 1 run at a time.
      if (this.maxParallel > 1) {
        return { allowed: false, reason: 'monitoring failed, max parallel must be 1 in conservative mode' };
      }
      return { allowed: true };
    }

    // Low memory check
    if (state.ramFreeGB < this.minFreeRamGB) {
      return { allowed: false, reason: `low RAM (${state.ramFreeGB.toFixed(2)} GB free < ${this.minFreeRamGB} GB required)` };
    }

    // GPU Checks
    const gpuState = await getGpuProbe(this.probeType);
    
    if (gpuState.temperatureC !== null) {
      if (gpuState.temperatureC >= this.maxTempC) {
        return { allowed: false, reason: `GPU temperature too high (${gpuState.temperatureC}°C >= ${this.maxTempC}°C). Cooling down.` };
      }
      const warnThreshold = this.maxTempC - 3;
      if (gpuState.temperatureC > warnThreshold) {
        console.warn(`[Governor] Warning: GPU temperature is high (${gpuState.temperatureC}°C, limit ${this.maxTempC}°C).`);
      }
    }

    if (gpuState.vramFreeMB !== null && gpuState.vramFreeMB < this.minFreeVramMB) {
      return { allowed: false, reason: `low VRAM (${gpuState.vramFreeMB} MB free < ${this.minFreeVramMB} MB required)` };
    }

    return { allowed: true };
  }
}
